// pages/index.js
import Head from 'next/head';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  collection, getDocs, query, orderBy, doc, deleteDoc,
  getDoc, limit, startAfter,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useRouter } from 'next/router';
import { useUser } from '../contexts/UserContext';

import CommentDrawer from '@/components/CommentDrawer';
import UploadModal from '@/components/UploadModal';
import RecipeCard from '@/components/RecipeCard';
import LikeButton from '@/components/LikeButton';

import { HiOutlineDotsHorizontal } from 'react-icons/hi';
import { FaRegCommentDots } from 'react-icons/fa';

import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import { useSearch } from '@/contexts/SearchContext';
import { useCategory } from '@/contexts/CategoryContext';

/* ============================================================== */
/* 메인 페이지                                                     */
/* ============================================================== */
export default function HomePage({ initialRecipes = [], error = null }) {
  const { t } = useTranslation('common');
  const { keyword, searchCategory } = useSearch();
  const { category }               = useCategory();
  const { user }                   = useUser();
  const router                     = useRouter();

  /* ---------------------------- state --------------------------- */
  const [recipes,       setRecipes]       = useState(initialRecipes);
  const [topComments,   setTopComments]   = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [drawerRecipeId, setDrawerRecipeId] = useState(null);
  const [modalOpen,       setModalOpen]     = useState(false);
  const [dropdownOpenId,  setDropdownOpenId] = useState(null);

  const [lastRecipeId,  setLastRecipeId]  = useState(
    initialRecipes.length > 0 ? initialRecipes[initialRecipes.length - 1].id : null
  );
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [hasMore,       setHasMore]       = useState(initialRecipes.length >= 5);
  const observer = useRef(null);
  const [ssrError, setSsrError] = useState(error);

  const PAGE_SIZE = 5;

  /* ------------------ 댓글 Top + 개수 메타 가져오기 -------------- */
  const fetchTopComment = async (recipeId) => {
    const ref  = collection(db, 'recipes', recipeId, 'comments');
    const snap = await getDocs(query(ref, orderBy('likes', 'desc')));

    /* 총 댓글 수 */
    setCommentCounts(p => ({ ...p, [recipeId]: snap.size }));

    if (snap.empty) {
      setTopComments(p => ({ ...p, [recipeId]: null }));
      return;
    }

    const top  = { id: snap.docs[0].id, ...snap.docs[0].data() };
    let name   = top.author || t('anonymous');

    if (top.uid) {
      const uSnap = await getDoc(doc(db, 'users', top.uid));
      if (uSnap.exists()) name = uSnap.data().displayName || name;
    }
    setTopComments(p => ({ ...p, [recipeId]: { ...top, displayName:name } }));
  };

  /* ----------------------- 레시피 목록 --------------------------- */
  const fetchRecipes = async (initial = false) => {
    if (!initial && !hasMore) return;

    try {
      let q;
      if (initial) {
        q = query(
          collection(db, 'recipes'),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );
      } else if (lastRecipeId) {
        // 마지막 레시피 문서를 가져와서 startAfter에 사용
        const lastDoc = await getDoc(doc(db, 'recipes', lastRecipeId));
        if (!lastDoc.exists()) return;
        
        q = query(
          collection(db, 'recipes'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      } else {
        return;
      }

      const snap = await getDocs(q);
      const base = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const merged = await Promise.all(base.map(async (r) => {
        if (!r.uid) return r;
        try {
          const uSnap = await getDoc(doc(db, 'users', r.uid));
          const uData = uSnap.exists() ? uSnap.data() : {};
          return {
            ...r,
            authorName:  uData.displayName  || r.authorName  || t('anonymous'),
            authorImage: uData.profileImage || r.authorImage || '',
            // 타임스탬프 직렬화
            createdAt: r.createdAt?.toDate?.() ? r.createdAt.toDate().toISOString() : r.createdAt,
            updatedAt: r.updatedAt?.toDate?.() ? r.updatedAt.toDate().toISOString() : r.updatedAt,
          };
        } catch { return r; }
      }));

      setRecipes(prev => initial ? merged : [...prev, ...merged]);

      if (snap.empty || snap.docs.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        // 마지막 레시피의 ID 저장
        setLastRecipeId(snap.docs[snap.docs.length - 1].id);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  // 클라이언트에서 초기 레시피 로드 (SSR 실패 시 또는 데이터가 없을 때만)
  useEffect(() => { 
    if (initialRecipes.length === 0 || ssrError) {
      fetchRecipes(true);
    }
  }, []);
  
  // 레시피가 로드될 때마다 댓글 정보 가져오기
  useEffect(() => { 
    recipes.forEach(r => {
      if (!topComments[r.id]) {
        fetchTopComment(r.id);
      }
    });
  }, [recipes]);

  /* -------------------- 무한 스크롤 옵저버 ----------------------- */
  const lastRecipeRef = useCallback(node => {
    if (loadingMore || !hasMore) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && lastRecipeId) {
        setLoadingMore(true);
        fetchRecipes(false).finally(() => setLoadingMore(false));
      }
    });

    if (node) observer.current.observe(node);
  }, [lastRecipeId, loadingMore, hasMore]);

  /* ---------------------------- 삭제 ---------------------------- */
  const handleDeleteRecipe = async (id) => {
    if (!confirm(t('confirm_delete_recipe'))) return;
    await deleteDoc(doc(db, 'recipes', id));
    fetchRecipes(true);
  };

  /* --------------------------- 업로드 --------------------------- */
  const handleUploadClick = () => {
    if (!user) { alert(t('login_required')); return; }
    setModalOpen(true);
  };

  /* ------------------------- 필터링 ------------------------------ */
  const filteredRecipes = recipes.filter(r => {
    const kw = keyword?.toLowerCase() || '';
    const kwMatch = kw
      ? (r.title?.toLowerCase().includes(kw) ||
         r.description?.toLowerCase().includes(kw))
      : true;

    const catMatch   = category       ? r.category === category       : true;
    const sCatMatch  = searchCategory ? r.category === searchCategory : true;
    return kwMatch && catMatch && sCatMatch;
  });

  /* =========================  UI  =============================== */
  return (
    <>
      <Head>
        <title>{t('meta_title')}</title>
        <meta name="description" content={t('meta_description')} />
        <meta property="og:title"       content={t('meta_title')} />
        <meta property="og:description" content={t('meta_description')} />
        <meta property="og:image"       content="https://wackyfoki.com/og-image.png" />
        <meta property="og:type"        content="website" />
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content={t('meta_title')} />
        <meta name="twitter:description" content={t('meta_description')} />
        <meta name="twitter:image"       content="https://wackyfoki.com/og-image.png" />
      </Head>

      <div className="p-8 max-w-3xl mx-auto bg-[var(--background)] text-[var(--foreground)]">

        {/* 업로드 영역 ------------------------------------------------- */}
        <div className="bg-[var(--card-bg)] p-4 rounded-xl shadow mb-6">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={user?.profileImage || user?.photoURL || '/default-avatar.png'}
              alt="profile"
              className="w-10 h-10 rounded-full object-cover"
            />
            <button
              onClick={handleUploadClick}
              className="flex-1 text-left px-4 py-2 rounded-full bg-[var(--input-bg)]
                         hover:bg-[var(--hover-bg)]"
            >
              {t('upload_placeholder')}
            </button>
          </div>
          <div className="flex justify-center">
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-1 hover:text-blue-500"
            >
              🖼️ <span>{t('photo_youtube')}</span>
            </button>
          </div>
        </div>

        <UploadModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onUploaded={() => fetchRecipes(true)}
        />

        <h1 className="text-2xl font-bold mb-4">🍽️ {t('title_feed')}</h1>
        {user ? (
          <p className="text-orange-500 mb-6">
            🔥 {t('welcome', { name: user.displayName || user.email })}
          </p>
        ) : (
          <p className="text-gray-500 mb-6">{t('not_logged_in')}</p>
        )}
        
        {/* SSR 에러 표시 (개발 환경에서만) */}
        {ssrError && process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">SSR Error: {ssrError}</p>
          </div>
        )}

        {filteredRecipes.length === 0 && recipes.length === 0 && <p>{t('no_recipe')}</p>}
        {filteredRecipes.length === 0 && recipes.length > 0 && <p>{t('no_filtered_results')}</p>}

        {/* -------------------- 레시피 카드 리스트 ------------------- */}
        <div className="flex flex-col gap-6">
          {filteredRecipes.map((recipe, idx) => {
            const top      = topComments[recipe.id];
            const cnt      = commentCounts[recipe.id] ?? 0;
            const isLast   = idx === filteredRecipes.length - 1;

            return (
              <div key={recipe.id} ref={isLast ? lastRecipeRef : null}>

                {/* 카드 래퍼 ---------------------------------------- */}
                <div className="relative bg-[var(--card-bg)] text-[var(--card-text)]
                                rounded-xl shadow-md p-6 pt-12">

                  {/* ⋯ 드롭다운 ------------------------------------ */}
                  {user?.uid === recipe.uid && (
                    <div className="absolute top-3 right-3 z-20">
                      <button
                        onClick={() =>
                          setDropdownOpenId(dropdownOpenId === recipe.id ? null : recipe.id)
                        }
                        className="p-2 rounded-full hover:bg-[var(--hover-bg)]"
                      >
                        <HiOutlineDotsHorizontal
                          className="text-xl"
                          style={{ color:'var(--icon-muted)' }}
                        />
                      </button>

                      {dropdownOpenId === recipe.id && (
                        <div
                          className="absolute right-0 mt-2 w-44 rounded shadow-lg dropdown-menu"
                          style={{
                            backgroundColor:'var(--dropdown-bg)',
                            color:          'var(--card-text)',
                            border:         '1px solid var(--border-color)',
                          }}
                        >
                          <button
                            onClick={() => router.push(`/edit/${recipe.id}`)}
                            className="w-full text-left px-4 py-2 hover:bg-[var(--hover-bg)]"
                          >
                            ✏️ {t('edit')}
                          </button>
                          <button
                            onClick={() => handleDeleteRecipe(recipe.id)}
                            className="w-full text-left px-4 py-2 hover:bg-[var(--hover-bg)]"
                            style={{ color:'#e11d48' }}
                          >
                            🗑 {t('delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 레시피 카드 본문 ------------------------------ */}
                  <RecipeCard recipe={recipe} />

                  {/* 좋아요 · 댓글 · 상세보기 ------------------------ */}
                  <div className="flex items-center gap-4 my-3">
                    <LikeButton
                      path={`recipes/${recipe.id}`}
                      uid={user?.uid}
                      likedBy={recipe.likedBy}
                      likes={recipe.likes}
                      onChange={() => fetchRecipes(true)}
                    />

                    {/* 말풍선 아이콘 */}
                    <button
                      onClick={() =>
                        setDrawerRecipeId(prev =>
                          prev === recipe.id ? null : recipe.id
                        )
                      }
                      className="flex items-center gap-1 translate-y-[1px]
                                 hover:text-blue-500"
                      style={{ color:'var(--icon-muted)' }}
                    >
                      <FaRegCommentDots className="text-xl" />
                      <span className="text-sm">{cnt}</span>
                    </button>

                    <button
                      onClick={() => router.push(`/recipe/${recipe.id}`)}
                      className="ml-auto text-sm px-4 py-1 rounded
                                 bg-[var(--input-bg)] hover:bg-[var(--hover-bg)]"
                    >
                      👉 {t('see_detail')}
                    </button>
                  </div>

                  {/* Top comment 미리보기 ------------------------- */}
                  {top && (
                    <div className="mt-6 pt-4 border-t border-[var(--border-color)]
                                    text-sm bg-[var(--card-bg)] p-2 rounded">
                      💬 <strong>{top.displayName}</strong>: {top.content}
                    </div>
                  )}
                </div>

                {/* 중간 광고 샘플 ---------------------------------- */}
                {idx === 2 && (
                  <div className="my-6 flex justify-center">
                    <div className="w-full max-w-[728px] h-[90px] bg-gray-200
                                    flex items-center justify-center rounded shadow">
                      🔸 광고 자리 (중간)
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 댓글 드로어 ----------------------------------------- */}
        <CommentDrawer
          recipeId={drawerRecipeId}
          open={!!drawerRecipeId}
          onClose={() => {
            setDrawerRecipeId(null);
            if (drawerRecipeId) fetchTopComment(drawerRecipeId);
          }}
          user={user}
        />

        {/* 로딩/끝 표시 --------------------------------------- */}
        {loadingMore && (
          <div className="text-center py-4 text-sm text-gray-500">
            {t('loading_more')}
          </div>
        )}
        {!hasMore && (
          <div className="text-center py-4 text-sm text-gray-400">
            {t('no_more_recipes')}
          </div>
        )}
      </div>
    </>
  );
}

/* ----------------------- i18n SSR with Safe Firebase ------------------------------ */
export async function getServerSideProps({ locale }) {
  try {
    // 환경변수 체크
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.warn('Missing Firebase environment variables:', missingVars);
      // 환경변수가 없어도 페이지는 로드되도록 함
      return {
        props: {
          ...(await serverSideTranslations(locale, ['common'])),
          initialRecipes: [],
          error: 'Firebase configuration missing'
        },
      };
    }

    // Firebase Admin SDK를 사용하여 서버에서 데이터 가져오기
    let initialRecipes = [];
    
    try {
      // Firebase Admin SDK 동적 import (서버 사이드에서만)
      const { getFirestore } = await import('firebase-admin/firestore');
      const { initializeApp, cert, getApps } = await import('firebase-admin/app');
      
      // 이미 초기화되었는지 확인
      if (getApps().length === 0) {
        // 서비스 계정 키가 있는 경우 사용, 없으면 기본 초기화
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          initializeApp({
            credential: cert(serviceAccount)
          });
        } else {
          // 기본 초기화 (Vercel 등의 환경에서는 자동으로 인증됨)
          initializeApp();
        }
      }

      const adminDb = getFirestore();
      
      // 최신 레시피 5개 가져오기
      const recipesSnapshot = await adminDb
        .collection('recipes')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      // 데이터 직렬화 및 사용자 정보 병합
      initialRecipes = await Promise.all(
        recipesSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          let authorData = {
            authorName: data.authorName || 'Anonymous',
            authorImage: data.authorImage || ''
          };

          // 사용자 정보 가져오기 시도
          if (data.uid) {
            try {
              const userDoc = await adminDb.collection('users').doc(data.uid).get();
              if (userDoc.exists) {
                const userData = userDoc.data();
                authorData = {
                  authorName: userData.displayName || authorData.authorName,
                  authorImage: userData.profileImage || authorData.authorImage
                };
              }
            } catch (userError) {
              console.warn('Failed to fetch user data:', userError);
            }
          }

          return {
            id: doc.id,
            ...data,
            ...authorData,
            // 타임스탬프 직렬화
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : null,
            // Firestore 특수 객체 제거
            likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
            likes: typeof data.likes === 'number' ? data.likes : 0
          };
        })
      );
    } catch (firebaseError) {
      console.error('Firebase Admin SDK error:', firebaseError);
      // Firebase Admin SDK 사용 불가 시 클라이언트 SDK로 폴백
      try {
        const { db } = require('../firebase/config');
        const { collection, getDocs, query, orderBy, limit, doc, getDoc } = require('firebase/firestore');
        
        const q = query(
          collection(db, 'recipes'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const snapshot = await getDocs(q);
        const recipes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // 사용자 정보 병합
        initialRecipes = await Promise.all(
          recipes.map(async (recipe) => {
            if (!recipe.uid) return {
              ...recipe,
              createdAt: recipe.createdAt?.toDate?.() ? recipe.createdAt.toDate().toISOString() : null,
              updatedAt: recipe.updatedAt?.toDate?.() ? recipe.updatedAt.toDate().toISOString() : null,
              likedBy: recipe.likedBy || [],
              likes: recipe.likes || 0
            };
            
            try {
              const userSnap = await getDoc(doc(db, 'users', recipe.uid));
              const userData = userSnap.exists() ? userSnap.data() : {};
              return {
                ...recipe,
                authorName: userData.displayName || recipe.authorName || 'Anonymous',
                authorImage: userData.profileImage || recipe.authorImage || '',
                createdAt: recipe.createdAt?.toDate?.() ? recipe.createdAt.toDate().toISOString() : null,
                updatedAt: recipe.updatedAt?.toDate?.() ? recipe.updatedAt.toDate().toISOString() : null,
                likedBy: recipe.likedBy || [],
                likes: recipe.likes || 0
              };
            } catch {
              return {
                ...recipe,
                createdAt: recipe.createdAt?.toDate?.() ? recipe.createdAt.toDate().toISOString() : null,
                updatedAt: recipe.updatedAt?.toDate?.() ? recipe.updatedAt.toDate().toISOString() : null,
                likedBy: recipe.likedBy || [],
                likes: recipe.likes || 0
              };
            }
          })
        );
      } catch (clientError) {
        console.error('Firebase client SDK error:', clientError);
        // 모든 Firebase 연결 실패 시에도 페이지는 로드
      }
    }

    return {
      props: {
        ...(await serverSideTranslations(locale, ['common'])),
        initialRecipes,
        error: null
      },
    };
  } catch (error) {
    console.error('getServerSideProps error:', error);
    // 최상위 에러 발생 시에도 페이지 로드 보장
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common'])),
        initialRecipes: [],
        error: error.message || 'Unknown error occurred'
      },
    };
  }
}
