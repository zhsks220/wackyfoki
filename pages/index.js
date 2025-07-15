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
export default function HomePage({ initialRecipes = [], initialHasMore = true }) {
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

  const [lastRecipeId,  setLastRecipeId]  = useState(initialRecipes.length > 0 ? initialRecipes[initialRecipes.length - 1].id : null);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [hasMore,       setHasMore]       = useState(initialHasMore);
  const observer = useRef(null);

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

  // SSR로 초기 데이터를 받아왔으므로, 클라이언트에서 첫 로드 생략
  // 초기 레시피의 댓글 정보만 가져오기
  useEffect(() => { 
    if (initialRecipes.length > 0) {
      initialRecipes.forEach(r => fetchTopComment(r.id));
    }
  }, []);
  
  // 새로운 레시피가 추가될 때만 댓글 정보 가져오기
  useEffect(() => { 
    if (recipes.length > initialRecipes.length) {
      const newRecipes = recipes.slice(initialRecipes.length);
      newRecipes.forEach(r => fetchTopComment(r.id));
    }
  }, [recipes.length]);

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

/* ----------------------- i18n SSR ------------------------------ */
export async function getServerSideProps({ locale }) {
  try {
    // 초기 레시피 5개 가져오기
    const q = query(
      collection(db, 'recipes'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const snap = await getDocs(q);
    const base = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // Firebase 타임스탬프 직렬화
    const serializedRecipes = await Promise.all(base.map(async (r) => {
      // 사용자 정보 병합
      let authorName = r.authorName || 'Anonymous';
      let authorImage = r.authorImage || '';
      
      if (r.uid) {
        try {
          const uSnap = await getDoc(doc(db, 'users', r.uid));
          if (uSnap.exists()) {
            const uData = uSnap.data();
            authorName = uData.displayName || authorName;
            authorImage = uData.profileImage || authorImage;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      
      return {
        ...r,
        authorName,
        authorImage,
        // Firebase 타임스탬프 직렬화
        createdAt: r.createdAt?.toDate?.() ? r.createdAt.toDate().toISOString() : null,
        updatedAt: r.updatedAt?.toDate?.() ? r.updatedAt.toDate().toISOString() : null,
        // likedBy 배열 확인 및 직렬화
        likedBy: Array.isArray(r.likedBy) ? r.likedBy : [],
        likes: r.likes || 0,
      };
    }));
    
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common'])),
        initialRecipes: serializedRecipes,
        initialHasMore: snap.docs.length === 5,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common'])),
        initialRecipes: [],
        initialHasMore: true,
      },
    };
  }
}
