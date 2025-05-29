'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  addDoc,
  serverTimestamp,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useRouter } from 'next/router';
import { useUser } from '../contexts/UserContext';
import CommentDrawer from '../components/CommentDrawer';
import UploadModal from '../components/UploadModal';
import RecipeCard from '@/components/RecipeCard'; // ✅ 새 카드

export default function HomePage() {
  const [recipes, setRecipes] = useState([]);
  const [topComments, setTopComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [drawerRecipeId, setDrawerRecipeId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { user } = useUser();
  const router = useRouter();

  /* ───────── Firestore: 레시피 & 작성자 정보 ───────── */
  const fetchRecipes = async () => {
    const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const baseData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // 작성자 프로필 병합
    const updatedData = await Promise.all(
      baseData.map(async (r) => {
        if (!r.uid) return r;
        try {
          const userSnap = await getDoc(doc(db, 'users', r.uid));
          const userData = userSnap.exists() ? userSnap.data() : {};
          return {
            ...r,
            authorName: userData.displayName || r.authorName || '익명',
            authorImage: userData.profileImage || r.authorImage || '',
          };
        } catch {
          return r;
        }
      }),
    );

    setRecipes(updatedData);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  /* ───────── Firestore: 대표 댓글 ───────── */
  const fetchTopComment = async (recipeId) => {
    const ref = collection(db, 'recipes', recipeId, 'comments');
    const q = query(ref, orderBy('likes', 'desc'));
    const snap = await getDocs(q);
    const top = snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    setTopComments((p) => ({ ...p, [recipeId]: top }));
  };

  useEffect(() => {
    if (recipes.length) {
      recipes.forEach((r) => fetchTopComment(r.id));
    }
  }, [recipes]);

  /* ───────── 좋아요(레시피) ───────── */
  const toggleRecipeLike = async (recipeId) => {
    if (!user?.uid) return alert('로그인 후 이용 가능합니다.');
    const recipeRef = doc(db, 'recipes', recipeId);
    const recipe = recipes.find((r) => r.id === recipeId);
    const liked = recipe.likedBy?.includes(user.uid);
    const newLikedBy = liked
      ? recipe.likedBy.filter((u) => u !== user.uid)
      : [...(recipe.likedBy || []), user.uid];

    await updateDoc(recipeRef, {
      likedBy: liked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      likes: newLikedBy.length,
    });

    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId ? { ...r, likedBy: newLikedBy, likes: newLikedBy.length } : r,
      ),
    );
  };

  /* ───────── 댓글 작성 ───────── */
  const handleCommentSubmit = async (e, recipeId) => {
    e.preventDefault();
    if (!user?.uid) return;
    const content = commentInputs[recipeId]?.trim();
    if (!content) return;

    const ref = collection(db, 'recipes', recipeId, 'comments');
    await addDoc(ref, {
      author: user.displayName || user.email,
      uid: user.uid,
      content,
      likes: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
    });

    setCommentInputs((prev) => ({ ...prev, [recipeId]: '' }));
    await fetchTopComment(recipeId);
  };

  /* ───────── 댓글 삭제 ───────── */
  const deleteComment = async (recipeId, commentId) => {
    if (!user?.uid) return;
    const ok = confirm('정말로 댓글을 삭제하시겠습니까?');
    if (!ok) return;
    await deleteDoc(doc(db, 'recipes', recipeId, 'comments', commentId));
    await fetchTopComment(recipeId);
  };

  /* ───────── 댓글 좋아요 ───────── */
  const toggleCommentLike = async (recipeId, comment) => {
    if (!user?.uid) return alert('로그인 후 이용 가능합니다.');
    const ref = doc(db, 'recipes', recipeId, 'comments', comment.id);
    const liked = comment.likedBy?.includes(user.uid);
    const newLikedBy = liked
      ? comment.likedBy.filter((u) => u !== user.uid)
      : [...(comment.likedBy || []), user.uid];

    await updateDoc(ref, {
      likedBy: newLikedBy,
      likes: newLikedBy.length,
    });

    await fetchTopComment(recipeId);
  };

  /* ───────── UI ───────── */
  return (
    <div className="p-8 max-w-3xl mx-auto bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      {/* ─ 업로드 창 (로그인 시) ─ */}
      {user && (
        <div className="bg-[var(--card-bg)] p-4 rounded-xl shadow mb-6">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={user?.profileImage || user?.photoURL || '/default-avatar.png'}
              alt="프로필"
              className="w-10 h-10 rounded-full object-cover"
            />
            <button
              onClick={() => setModalOpen(true)}
              className="flex-1 text-left px-4 py-2 rounded-full
              bg-[var(--input-bg)] hover:brightness-95 dark:hover:brightness-110 transition"
            >
              어떤 레시피를 공유하시겠습니까?
            </button>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1 hover:text-blue-500 transition"
            >
              🖼️ <span>사진 및 유튜브</span>
            </button>
          </div>
        </div>
      )}

      {/* 업로드 모달 */}
      <UploadModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onUploaded={fetchRecipes} />

      <h1 className="text-2xl font-bold mb-4">🍽️ 워키포키 괴식 피드</h1>

      {user ? (
        <p className="text-orange-500 mb-6">🔥 {user.displayName || user.email}님, 환영합니다!</p>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 mb-6">로그인하지 않으셨습니다.</p>
      )}

      {recipes.length === 0 && <p>업로드된 괴식이 아직 없어요!</p>}

      {/* ───────── 피드 목록 ───────── */}
      <div className="flex flex-col gap-6">
        {recipes.map((recipe) => {
          const liked = user?.uid && recipe.likedBy?.includes(user.uid);
          const topComment = topComments[recipe.id];

          return (
            <div
              key={recipe.id}
              className="bg-[var(--card-bg)] text-[var(--card-text)] rounded-xl shadow-md p-6"
            >
              {/* ★ 카드 본문 → RecipeCard */}
              <RecipeCard recipe={recipe} />

              {/* ─ 좋아요/상세보기 ─ */}
              <div className="flex items-center gap-2 my-3">
                <button onClick={() => toggleRecipeLike(recipe.id)} className="text-2xl">
                  {liked ? '❤️' : '🤍'}
                </button>
                <span className="text-sm opacity-70">좋아요 {recipe.likes || 0}개</span>

                <button
                  onClick={() => router.push(`/recipe/${recipe.id}`)}
                  className="text-sm ml-auto px-4 py-1 rounded
                  bg-[var(--input-bg)] hover:brightness-95 dark:hover:brightness-110 transition"
                >
                  👉 상세 보기
                </button>
              </div>

              {/* ─ 댓글 요약 & 작성 폼 ─ */}
              <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
                {topComment && (
                  <div className="mb-3 text-sm bg-[var(--card-bg)] p-2 rounded">
                    💬 <strong>{topComment.author}</strong>: {topComment.content}
                  </div>
                )}

                {/* 댓글 입력 */}
                {user ? (
                  <form onSubmit={(e) => handleCommentSubmit(e, recipe.id)} className="flex gap-2">
                    <input
                      type="text"
                      value={commentInputs[recipe.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [recipe.id]: e.target.value }))
                      }
                      placeholder="댓글을 입력하세요"
                      className="flex-1 text-sm px-3 py-1 border rounded bg-transparent"
                    />
                    <button
                      type="submit"
                      className="text-sm px-3 py-1 bg-[var(--header-bg)] rounded hover:brightness-110 active:scale-95 transition"
                    >
                      등록
                    </button>
                  </form>
                ) : (
                  <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                    ※ 로그인 후 댓글을 작성할 수 있습니다.
                  </p>
                )}

                {/* 댓글 Drawer 열기 */}
                <button
                  onClick={() => setDrawerRecipeId(recipe.id)}
                  className="text-xs underline mt-3"
                >
                  💬 댓글 전체 보기
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 댓글 Drawer */}
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
