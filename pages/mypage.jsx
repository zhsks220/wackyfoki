'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

import { useUser } from '@/contexts/UserContext';
import { db } from '@/firebase/config';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

export default function MyPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { user } = useUser();

  const [tab, setTab] = useState('my');
  const [sortOrder, setSortOrder] = useState('new');
  const [userData, setUserData] = useState(null);
  const [myRecipes, setMyRecipes] = useState([]);
  const [liked, setLiked] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState({
    my: false,
    liked: false,
    comments: false
  });
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [lastCheckedRecipeIndex, setLastCheckedRecipeIndex] = useState(0);
  const [allRecipeIds, setAllRecipeIds] = useState([]);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState({
    my: 1,
    liked: 1,
    comments: 1
  });
  const ITEMS_PER_PAGE = 10;

  // 🔒 로그인 체크
  useEffect(() => {
    if (user === undefined) return; // 아직 로딩 중
    if (user === null) {
      setLoading(false);
      return;
    }

    // 사용자 정보만 먼저 로드
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) setUserData(snap.data());
      } catch (e) {
        console.error('Error fetching user data:', e);
      } finally {
        setLoading(false);
      }
    };

    // 각 탭의 데이터를 개별적으로 로드
    const fetchMyRecipes = async () => {
      setTabLoading(prev => ({ ...prev, my: true }));
      try {
        const qMy = query(collection(db, 'recipes'), where('uid', '==', user.uid));
        const mySnap = await getDocs(qMy);
        setMyRecipes(mySnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Error fetching my recipes:', e);
      } finally {
        setTabLoading(prev => ({ ...prev, my: false }));
      }
    };


    // 사용자 정보와 첫 번째 탭 데이터만 로드
    fetchUserData();
    fetchMyRecipes();
  }, [user]);

  const sortByTime = (arr) =>
    [...arr].sort((a, b) => {
      const aT = a.createdAt?.seconds ?? 0;
      const bT = b.createdAt?.seconds ?? 0;
      return sortOrder === 'new' ? bT - aT : aT - bT;
    });
  
  // 페이지네이션 함수
  const paginate = (items, page) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return items.slice(startIndex, endIndex);
  };
  
  const getTotalPages = (items) => Math.ceil(items.length / ITEMS_PER_PAGE);
  
  // 탭 변경 시 페이지 리셋 및 데이터 로드
  const handleTabChange = async (newTab) => {
    setTab(newTab);
    setCurrentPage(prev => ({ ...prev, [newTab]: 1 }));
    
    // 해당 탭의 데이터가 없으면 로드
    if (newTab === 'liked' && liked.length === 0 && !tabLoading.liked) {
      await fetchLikedRecipes();
    } else if (newTab === 'comments' && comments.length === 0 && !tabLoading.comments) {
      // 댓글 탭 초기화
      setComments([]);
      setCommentsPage(1);
      setLastCheckedRecipeIndex(0);
      setHasMoreComments(true);
      await fetchCommentsData();
    }
  };
  
  // 댓글 데이터 로드 함수 - 페이지네이션 적용
  const fetchCommentsData = async (page = 1, isLoadMore = false) => {
    if (!isLoadMore) {
      setTabLoading(prev => ({ ...prev, comments: true }));
    }
    
    try {
      // 첫 페이지일 때만 레시피 목록 가져오기
      if (page === 1 && allRecipeIds.length === 0) {
        const recipesSnapshot = await getDocs(collection(db, 'recipes'));
        const recipeData = recipesSnapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title
        }));
        setAllRecipeIds(recipeData);
        
        // 댓글 가져오기
        await loadCommentsForPage(recipeData, 0, isLoadMore);
      } else {
        // 이어서 로드
        await loadCommentsForPage(allRecipeIds, lastCheckedRecipeIndex, isLoadMore);
      }
    } catch (e) {
      console.error('Error fetching comments:', e);
    } finally {
      setTabLoading(prev => ({ ...prev, comments: false }));
    }
  };
  
  // 페이지별로 댓글 로드
  const loadCommentsForPage = async (recipeData, startIndex, isLoadMore = false) => {
    const RECIPES_PER_BATCH = 10; // 한 번에 확인할 레시피 수
    const TARGET_COMMENTS = 10; // 목표 댓글 수
    
    let currentComments = isLoadMore ? [...comments] : [];
    let foundComments = 0;
    let checkedIndex = startIndex;
    
    // 목표 댓글 수에 도달하거나 모든 레시피를 확인할 때까지 반복
    while (foundComments < TARGET_COMMENTS && checkedIndex < recipeData.length) {
      const endIndex = Math.min(checkedIndex + RECIPES_PER_BATCH, recipeData.length);
      
      for (let i = checkedIndex; i < endIndex && foundComments < TARGET_COMMENTS; i++) {
        const recipe = recipeData[i];
        const commentsQuery = query(
          collection(db, `recipes/${recipe.id}/comments`),
          where('uid', '==', user.uid)
        );
        const commentsSnapshot = await getDocs(commentsQuery);
        
        commentsSnapshot.forEach((doc) => {
          if (foundComments < TARGET_COMMENTS) {
            currentComments.push({
              recipeId: recipe.id,
              recipeTitle: recipe.title,
              ...doc.data(),
            });
            foundComments++;
          }
        });
      }
      
      checkedIndex = endIndex;
    }
    
    // 상태 업데이트
    setComments(currentComments);
    setLastCheckedRecipeIndex(checkedIndex);
    setHasMoreComments(checkedIndex < recipeData.length);
  };
  
  // 더 많은 댓글 로드
  const loadMoreComments = () => {
    if (hasMoreComments && !tabLoading.comments) {
      setCommentsPage(prev => prev + 1);
      fetchCommentsData(commentsPage + 1, true);
    }
  };
  
  // useEffect 내부에서 사용할 함수들 정의
  const fetchLikedRecipes = async () => {
    setTabLoading(prev => ({ ...prev, liked: true }));
    try {
      const qLiked = query(collection(db, 'recipes'), where('likedBy', 'array-contains', user.uid));
      const likedSnap = await getDocs(qLiked);
      setLiked(likedSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Error fetching liked recipes:', e);
    } finally {
      setTabLoading(prev => ({ ...prev, liked: false }));
    }
  };

  if (user === undefined || loading) {
    return <div className="p-4">{t('loading')}</div>;
  }

  if (user === null) {
    return <div className="p-4 text-red-500">{t('login_required')}</div>;
  }

  if (!userData) {
    return <div className="p-4 text-gray-500">{t('loading')}</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Profile */}
      <div className="flex items-center gap-4 mb-6">
        <Image
          src={userData.profileImage || '/default-profile.png'}
          alt={t('profile_image_alt')}
          width={80}
          height={80}
          className="rounded-full object-cover"
        />
        <div>
          <h2 className="text-2xl font-bold">
            {userData.displayName || t('no_nickname')}
          </h2>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <button
          onClick={() => router.push('/profile/edit')}
          className="ml-auto text-sm text-blue-500 hover:underline"
        >
          ✏️ {t('edit_profile')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-2">
        {['my', 'liked', 'comments'].map((key) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={tab === key ? 'font-bold underline' : 'text-gray-500'}
          >
            {t(
              key === 'my' ? 'my_feed' :
              key === 'liked' ? 'liked_feed' :
              'my_comments'
            )}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex justify-end mb-4">
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="border px-2 py-1 rounded text-sm"
        >
          <option value="new">{t('newest')}</option>
          <option value="old">{t('oldest')}</option>
        </select>
      </div>

      {/* My Recipes */}
      {tab === 'my' && (
        <div>
          {tabLoading.my ? (
            <div className="text-center py-8">{t('loading')}</div>
          ) : (
          <div className="grid gap-4">
            {paginate(sortByTime(myRecipes), currentPage.my).map((r) => (
            <div key={r.id} className="border p-3 rounded shadow">
              <Link href={`/recipe/${r.id}`} className="font-semibold hover:underline">
                {r.title}
              </Link>
              {r.imageUrl && (
                <Image
                  src={r.imageUrl}
                  alt={r.title}
                  width={300}
                  height={200}
                  className="rounded mt-2 object-cover"
                />
              )}
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => router.push(`/edit/${r.id}`)}
                  className="text-sm text-blue-500 underline"
                >
                  ✏️ {t('edit')}
                </button>
              </div>
            </div>
          ))}
            {myRecipes.length === 0 && (
              <p className="text-gray-500">{t('no_my_feed')}</p>
            )}
          </div>
          )}
          
          {/* 페이지네이션 */}
          {getTotalPages(myRecipes) > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => ({ ...prev, my: Math.max(1, prev.my - 1) }))}
                disabled={currentPage.my === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                ←
              </button>
              {[...Array(getTotalPages(myRecipes))].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(prev => ({ ...prev, my: i + 1 }))}
                  className={`px-3 py-1 border rounded ${
                    currentPage.my === i + 1 ? 'bg-blue-500 text-white' : ''
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => ({ ...prev, my: Math.min(getTotalPages(myRecipes), prev.my + 1) }))}
                disabled={currentPage.my === getTotalPages(myRecipes)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Liked Recipes */}
      {tab === 'liked' && (
        <div>
          {tabLoading.liked ? (
            <div className="text-center py-8">{t('loading')}</div>
          ) : (
          <div className="grid gap-4">
            {paginate(sortByTime(liked), currentPage.liked).map((r) => (
            <Link key={r.id} href={`/recipe/${r.id}`} className="border p-3 rounded shadow block">
              <div className="font-semibold">{r.title}</div>
              {r.imageUrl && (
                <Image
                  src={r.imageUrl}
                  alt={r.title}
                  width={300}
                  height={200}
                  className="rounded mt-2 object-cover"
                />
              )}
            </Link>
          ))}
            {liked.length === 0 && (
              <p className="text-gray-500">{t('no_liked_feed')}</p>
            )}
          </div>
          )}
          
          {/* 페이지네이션 */}
          {getTotalPages(liked) > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => ({ ...prev, liked: Math.max(1, prev.liked - 1) }))}
                disabled={currentPage.liked === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                ←
              </button>
              {[...Array(getTotalPages(liked))].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(prev => ({ ...prev, liked: i + 1 }))}
                  className={`px-3 py-1 border rounded ${
                    currentPage.liked === i + 1 ? 'bg-blue-500 text-white' : ''
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => ({ ...prev, liked: Math.min(getTotalPages(liked), prev.liked + 1) }))}
                disabled={currentPage.liked === getTotalPages(liked)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Comments */}
      {tab === 'comments' && (
        <div>
          {tabLoading.comments ? (
            <div className="text-center py-8">{t('loading')}</div>
          ) : (
          <>
            <div className="space-y-4">
              {sortByTime(comments).map((c, i) => (
              <div key={`${c.recipeId}-${i}`} className="border p-3 rounded shadow">
                <Link href={`/recipe/${c.recipeId}`} className="font-semibold hover:underline">
                  {c.recipeTitle}
                </Link>
                <p className="text-sm text-gray-600 mt-1">{c.content}</p>
              </div>
            ))}
              {comments.length === 0 && !hasMoreComments && (
                <p className="text-gray-500">{t('no_my_comments')}</p>
              )}
            </div>
            
            {/* 더보기 버튼 */}
            {hasMoreComments && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMoreComments}
                  disabled={tabLoading.comments}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {tabLoading.comments ? t('loading') : t('load_more')}
                </button>
              </div>
            )}
          </>
          )}
        </div>
      )}
    </div>
  );
}
