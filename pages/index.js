'use client';

import { useEffect, useState } from 'react';
import {
  collection, getDocs, query, orderBy, doc, deleteDoc,
  getDoc, addDoc, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useRouter } from 'next/router';
import { useUser } from '../contexts/UserContext';

import CommentDrawer from '@/components/CommentDrawer';
import UploadModal from '@/components/UploadModal';
import RecipeCard from '@/components/RecipeCard';
import LikeButton from '@/components/LikeButton';
import { HiOutlineDotsHorizontal } from 'react-icons/hi';

import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import { useSearch } from '@/contexts/SearchContext';
import { useCategory } from '@/contexts/CategoryContext';

export default function HomePage() {
  const { t } = useTranslation('common');
  const { keyword, searchCategory } = useSearch(); // ✅ searchCategory 추가
  const { category } = useCategory();

  const [recipes, setRecipes] = useState([]);
  const [topComments, setTopComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [drawerRecipeId, setDrawerRecipeId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);

  const { user } = useUser();
  const router = useRouter();

  const fetchRecipes = async () => {
    const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const base = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const merged = await Promise.all(
      base.map(async (r) => {
        if (!r.uid) return r;
        try {
          const uSnap = await getDoc(doc(db, 'users', r.uid));
          const uData = uSnap.exists() ? uSnap.data() : {};
          return {
            ...r,
            authorName: uData.displayName || r.authorName || t('anonymous'),
            authorImage: uData.profileImage || r.authorImage || '',
          };
        } catch {
          return r;
        }
      }),
    );
    setRecipes(merged);
  };

  useEffect(() => { fetchRecipes(); }, []);
  useEffect(() => { recipes.forEach(r => fetchTopComment(r.id)); }, [recipes]);

  const fetchTopComment = async (recipeId) => {
    const ref = collection(db, 'recipes', recipeId, 'comments');
    const snap = await getDocs(query(ref, orderBy('likes', 'desc')));
    const top = snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    setTopComments(p => ({ ...p, [recipeId]: top }));
  };

  const handleCommentSubmit = async (e, recipeId) => {
    e.preventDefault();
    if (!user?.uid) return;
    const content = commentInputs[recipeId]?.trim();
    if (!content) return;

    await addDoc(collection(db, 'recipes', recipeId, 'comments'), {
      author: user.displayName || user.email,
      uid: user.uid,
      content,
      likes: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
    });
    setCommentInputs(p => ({ ...p, [recipeId]: '' }));
    fetchTopComment(recipeId);
  };

  const deleteComment = async (recipeId, commentId) => {
    if (!user?.uid) return;
    if (!confirm(t('confirm_delete_comment'))) return;
    await deleteDoc(doc(db, 'recipes', recipeId, 'comments', commentId));
    fetchTopComment(recipeId);
  };

  const toggleCommentLike = async (recipeId, comment) => {
    if (!user?.uid) return alert(t('login_required'));
    const ref = doc(db, 'recipes', recipeId, 'comments', comment.id);
    const liked = comment.likedBy?.includes(user.uid);
    const list = liked ? comment.likedBy.filter(u => u !== user.uid) : [...(comment.likedBy || []), user.uid];

    await updateDoc(ref, { likedBy: list, likes: list.length });
    fetchTopComment(recipeId);
  };

  const handleDeleteRecipe = async (id) => {
    if (!confirm(t('confirm_delete_recipe'))) return;
    await deleteDoc(doc(db, 'recipes', id));
    fetchRecipes();
  };

  const handleUploadClick = () => {
    if (!user) {
      alert(t('login_required'));
      return;
    }
    setModalOpen(true);
  };

  // ✅ 검색 키워드 + 버튼 카테고리 + 드롭다운 카테고리 분리해서 필터링
  const filteredRecipes = recipes.filter((r) => {
    const keywordMatch = keyword
      ? (r.title?.toLowerCase().includes(keyword.toLowerCase()) ||
         r.description?.toLowerCase().includes(keyword.toLowerCase()))
      : true;

    const categoryMatch = category
      ? r.category === category
      : true;

    const searchCategoryMatch = searchCategory
      ? r.category === searchCategory
      : true;

    return keywordMatch && categoryMatch && searchCategoryMatch;
  });

  return (
    <div className="p-8 max-w-3xl mx-auto bg-[var(--background)] text-[var(--foreground)]">
      {/* 업로드 창 */}
      <div className="bg-[var(--card-bg)] p-4 rounded-xl shadow mb-6">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={user?.profileImage || user?.photoURL || '/default-avatar.png'}
            alt="profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <button
            onClick={handleUploadClick}
            className="flex-1 text-left px-4 py-2 rounded-full bg-[var(--input-bg)] hover:brightness-95 dark:hover:brightness-110"
          >
            {t('upload_placeholder')}
          </button>
        </div>
        <div className="flex justify-center">
          <button onClick={handleUploadClick} className="flex items-center gap-1 hover:text-blue-500">
            🖼️ <span>{t('photo_youtube')}</span>
          </button>
        </div>
      </div>

      <UploadModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onUploaded={fetchRecipes} />

      <h1 className="text-2xl font-bold mb-4">🍽️ {t('title_feed')}</h1>
      {user ? (
        <p className="text-orange-500 mb-6">🔥 {t('welcome', { name: user.displayName || user.email })}</p>
      ) : (
        <p className="text-gray-500 mb-6">{t('not_logged_in')}</p>
      )}

      {filteredRecipes.length === 0 && <p>{t('no_recipe')}</p>}

      <div className="flex flex-col gap-6">
        {filteredRecipes.map((recipe) => {
          const top = topComments[recipe.id];
          return (
            <div key={recipe.id} className="relative bg-[var(--card-bg)] text-[var(--card-text)] rounded-xl shadow-md p-6 pt-12">
              {user?.uid === recipe.uid && (
                <div className="absolute top-3 right-3 z-20">
                  <button
                    onClick={() => setDropdownOpenId(dropdownOpenId === recipe.id ? null : recipe.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-full"
                  >
                    <HiOutlineDotsHorizontal className="text-xl text-gray-600 dark:text-gray-300" />
                  </button>
                  {dropdownOpenId === recipe.id && (
                    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded shadow-lg">
                      <button onClick={() => router.push(`/edit/${recipe.id}`)} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700">
                        ✏️ {t('edit')}
                      </button>
                      <button onClick={() => handleDeleteRecipe(recipe.id)} className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-zinc-700">
                        🗑 {t('delete')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <RecipeCard recipe={recipe} />

              <div className="flex items-center gap-2 my-3">
                <LikeButton
                  path={`recipes/${recipe.id}`}
                  uid={user?.uid}
                  likedBy={recipe.likedBy}
                  likes={recipe.likes}
                  onChange={fetchRecipes}
                />
                <button onClick={() => router.push(`/recipe/${recipe.id}`)} className="text-sm ml-auto px-4 py-1 rounded bg-[var(--input-bg)] hover:brightness-95 dark:hover:brightness-110">
                  👉 {t('see_detail')}
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
                {top && (
                  <div className="mb-3 text-sm bg-[var(--card-bg)] p-2 rounded">
                    💬 <strong>{top.author}</strong>: {top.content}
                  </div>
                )}

                {user ? (
                  <form onSubmit={(e) => handleCommentSubmit(e, recipe.id)} className="flex gap-2">
                    <input
                      type="text"
                      value={commentInputs[recipe.id] || ''}
                      onChange={e => setCommentInputs(p => ({ ...p, [recipe.id]: e.target.value }))}
                      placeholder={t('comment_placeholder')}
                      className="flex-1 text-sm px-3 py-1 border rounded bg-transparent"
                    />
                    <button type="submit" className="text-sm px-3 py-1 bg-[var(--header-bg)] rounded hover:brightness-110">
                      {t('submit')}
                    </button>
                  </form>
                ) : (
                  <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">{t('login_required_comment')}</p>
                )}

                <button onClick={() => setDrawerRecipeId(recipe.id)} className="text-xs underline mt-3">
                  💬 {t('see_all_comments')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <CommentDrawer
        recipeId={drawerRecipeId}
        open={!!drawerRecipeId}
        onClose={() => setDrawerRecipeId(null)}
        user={user}
        onDelete={deleteComment}
        onLike={toggleCommentLike}
      />
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
