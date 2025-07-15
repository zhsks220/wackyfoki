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

  // 클라이언트에서 초기 레시피 로드 (ISR 실패 시 또는 데이터가 없을 때만)
  useEffect(() => { 
    if (initialRecipes.length === 0 || error) {
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
        
        {/* 구조화된 데이터로 레시피 목록 제공 (SEO/AI 인식용) */}
        {recipes.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                "name": "WackyFoki Recipes",
                "description": "Latest bizarre recipes from WackyFoki",
                "numberOfItems": recipes.length,
                "itemListElement": recipes.map((recipe, index) => ({
                  "@type": "Recipe",
                  "position": index + 1,
                  "name": recipe.title,
                  "description": recipe.description,
                  "image": recipe.imageUrls?.[0] || null,
                  "author": {
                    "@type": "Person",
                    "name": recipe.authorName || "Anonymous"
                  },
                  "datePublished": recipe.createdAt,
                  "url": `https://wackyfoki.com/recipe/${recipe.id}`
                }))
              })
            }}
          />
        )}
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
        
        {/* ISR 에러 표시 (개발 환경에서만) */}
        {ssrError && process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <p className="text-sm">ISR Error: {ssrError}</p>
          </div>
        )}

        {/* 디버깅 정보 - 프로덕션에서는 제거 필요 */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ background: '#f0f0f0', padding: '10px', marginBottom: '10px' }}>
            <p>Debug: initialRecipes={initialRecipes.length}, recipes={recipes.length}, filtered={filteredRecipes.length}</p>
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

/* ----------------------- i18n ISR with Client SDK ------------------------------ */
export async function getStaticProps({ locale = 'ko' }) {
  console.log('[ISR] Starting getStaticProps for index page');
  console.log('[ISR] Build time:', new Date().toISOString());
  console.log('[ISR] Locale:', locale);
  console.log('[ISR] Building static page for locale:', locale);
  
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
      console.warn('[ISR] Missing Firebase environment variables:', missingVars);
      // 환경변수가 없어도 페이지는 로드되도록 함
      return {
        props: {
          ...(await serverSideTranslations(locale, ['common'])),
          initialRecipes: [],
          error: 'Firebase configuration missing'
        },
        // ISR: 1분마다 재생성
        revalidate: 60,
      };
    }

    // Firebase 클라이언트 SDK를 사용하여 빌드 타임에 데이터 가져오기
    let initialRecipes = [];
    
    try {
      console.log('[ISR] Using Firebase Client SDK for data fetching at build time');
      
      // 클라이언트 SDK import - 일반 import 사용
      const { db } = await import('../firebase/config');
      const { collection, getDocs, query, orderBy, limit, doc, getDoc } = await import('firebase/firestore');
      
      // 최신 레시피 5개 가져오기
      const q = query(
        collection(db, 'recipes'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      console.log('[ISR] Fetching recipes from Firestore...');
      console.log('[ISR] Query details:', { collection: 'recipes', orderBy: 'createdAt', limit: 5 });
      
      const snapshot = await getDocs(q);
      const recipes = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      console.log(`[ISR] Fetched ${recipes.length} recipes for locale: ${locale}`);
      if (recipes.length === 0) {
        console.warn('[ISR] WARNING: No recipes found in Firestore!');
      }
      
      // 사용자 정보 병합
      initialRecipes = await Promise.all(
        recipes.map(async (recipe) => {
          // 기본값 설정
          const baseRecipe = {
            ...recipe,
            createdAt: recipe.createdAt?.toDate?.() ? recipe.createdAt.toDate().toISOString() : null,
            updatedAt: recipe.updatedAt?.toDate?.() ? recipe.updatedAt.toDate().toISOString() : null,
            likedBy: Array.isArray(recipe.likedBy) ? recipe.likedBy : [],
            likes: typeof recipe.likes === 'number' ? recipe.likes : 0,
            authorName: recipe.authorName || 'Anonymous',
            authorImage: recipe.authorImage || ''
          };
          
          // 사용자 정보가 있으면 가져오기
          if (recipe.uid) {
            try {
              console.log(`[ISR] Fetching user info for uid: ${recipe.uid}`);
              const userSnap = await getDoc(doc(db, 'users', recipe.uid));
              if (userSnap.exists()) {
                const userData = userSnap.data();
                return {
                  ...baseRecipe,
                  authorName: userData.displayName || baseRecipe.authorName,
                  authorImage: userData.profileImage || baseRecipe.authorImage
                };
              }
            } catch (userError) {
              console.warn(`[ISR] Failed to fetch user data for uid ${recipe.uid}:`, userError.message);
            }
          }
          
          return baseRecipe;
        })
      );
      
      console.log('[ISR] Successfully processed all recipes with user data');
    } catch (firebaseError) {
      console.error('[ISR] Firebase Client SDK error:', firebaseError.message);
      console.error('[ISR] Error details:', firebaseError);
      // Firebase 연결 실패 시에도 페이지는 로드 - 빈 배열 반환
      return {
        props: {
          ...(await serverSideTranslations(locale, ['common'])),
          initialRecipes: [],
          error: null // 빌드 시점 에러는 클라이언트에 노출하지 않음
        },
        // ISR: 1분마다 재생성
        revalidate: 60,
      };
    }

    console.log(`[ISR] Returning ${initialRecipes.length} recipes to the page for locale: ${locale}`);
    console.log('[ISR] First recipe title:', initialRecipes[0]?.title || 'No recipes');
    console.log('[ISR] All recipe titles:', initialRecipes.map(r => r.title).join(', '));
    
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common'])),
        initialRecipes,
        error: null
      },
      // ISR: 1분마다 재생성
      revalidate: 60,
    };
  } catch (error) {
    console.error('[ISR] Unexpected error in getStaticProps:', error.message);
    console.error('[ISR] Error stack:', error.stack);
    // 최상위 에러 발생 시에도 페이지 로드 보장 - 빈 배열 반환
    return {
      props: {
        ...(await serverSideTranslations(locale, ['common'])),
        initialRecipes: [],
        error: null // 빌드 시점 에러는 클라이언트에 노출하지 않음
      },
      // ISR: 1분마다 재생성
      revalidate: 60,
    };
  }
}
