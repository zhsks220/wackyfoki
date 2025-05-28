import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useRouter } from 'next/router';
import { useUser } from '../contexts/UserContext';
import CommentDrawer from '../components/CommentDrawer'; // ✅ 사이드패널 컴포넌트

function extractYouTubeId(url) {
  try {
    const regExp = /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&?/]+)/;
    const match = url.match(regExp);
    return match && match[1] ? match[1] : null;
  } catch {
    return null;
  }
}

export default function HomePage() {
  const [recipes, setRecipes] = useState([]);
  const [topComments, setTopComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [drawerRecipeId, setDrawerRecipeId] = useState(null); // ✅ 사이드패널 활성화용

  const router = useRouter();
  const user = useUser();

  useEffect(() => {
    (async () => {
      const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRecipes(data);
    })();
  }, []);

  const fetchTopComment = async (recipeId) => {
    const ref = collection(db, 'recipes', recipeId, 'comments');
    const q = query(ref, orderBy('likes', 'desc'));
    const snap = await getDocs(q);
    const top = snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    setTopComments((p) => ({ ...p, [recipeId]: top }));
  };

  useEffect(() => {
    if (recipes.length) recipes.forEach((r) => fetchTopComment(r.id));
  }, [recipes]);

  const toggleRecipeLike = async (recipeId) => {
    if (!user) return alert('로그인 후 이용 가능합니다.');
    const ref = doc(db, 'recipes', recipeId);
    const rec = recipes.find((r) => r.id === recipeId);
    const liked = rec.likedBy?.includes(user.uid);
    const newLikedBy = liked
      ? rec.likedBy.filter((u) => u !== user.uid)
      : [...(rec.likedBy || []), user.uid];

    await updateDoc(ref, { likedBy: newLikedBy, likes: newLikedBy.length });
    setRecipes((p) =>
      p.map((r) => (r.id === recipeId ? { ...r, likedBy: newLikedBy, likes: newLikedBy.length } : r))
    );
  };

  const handleCommentSubmit = async (e, recipeId) => {
    e.preventDefault();
    if (!user) return;
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

    setCommentInputs((p) => ({ ...p, [recipeId]: '' }));
    await fetchTopComment(recipeId);
  };

  const deleteComment = async (recipeId, commentId) => {
    if (!user) return;
    const ok = confirm('정말로 댓글을 삭제하시겠습니까?');
    if (!ok) return;

    await deleteDoc(doc(db, 'recipes', recipeId, 'comments', commentId));
    await fetchTopComment(recipeId);
  };

  const toggleCommentLike = async (recipeId, comment) => {
    if (!user) return alert('로그인 후 이용 가능합니다.');
    const ref = doc(db, 'recipes', recipeId, 'comments', comment.id);
    const liked = comment.likedBy?.includes(user.uid);
    const newLikedBy = liked
      ? comment.likedBy.filter((u) => u !== user.uid)
      : [...(comment.likedBy || []), user.uid];

    await updateDoc(ref, { likedBy: newLikedBy, likes: newLikedBy.length });
    await fetchTopComment(recipeId);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-4">🍽️ 워키포키 괴식 피드</h1>

      {user ? (
        <p className="text-orange-500 mb-6">🔥 {user.displayName || user.email}님, 환영합니다!</p>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 mb-6">로그인하지 않으셨습니다.</p>
      )}

      {recipes.length === 0 && <p>업로드된 괴식이 아직 없어요!</p>}

      <div className="flex flex-col gap-6">
        {recipes.map((recipe) => {
          const videoId = extractYouTubeId(recipe.youtubeUrl);
          const likedRecipe = user && recipe.likedBy?.includes(user.uid);
          const topComment = topComments[recipe.id];

          return (
            <div key={recipe.id} className="bg-[var(--card-bg)] text-[var(--card-text)] rounded-xl shadow-md p-6">
              <h2 className="text-lg font-semibold mb-1">{recipe.title}</h2>
              <p className="mb-4">{recipe.description}</p>

              {videoId ? (
                <div className="relative pb-[56.25%] h-0 mb-4">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    className="absolute top-0 left-0 w-full h-full rounded-md"
                    allowFullScreen
                  />
                </div>
              ) : (
                recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} className="w-full rounded-md mb-4" />
              )}

              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => toggleRecipeLike(recipe.id)} className="text-2xl">
                  {likedRecipe ? '❤️' : '🤍'}
                </button>
                <span className="text-sm opacity-70">좋아요 {recipe.likes || 0}개</span>
              </div>

              <button
                onClick={() => router.push(`/recipe/${recipe.id}`)}
                className="text-sm bg-black text-white px-4 py-1 rounded hover:bg-gray-800"
              >
                👉 상세 보기
              </button>

              <div className="mt-6 pt-4 border-t border-[var(--border-color)]">
                {topComment && (
                  <div className="mb-3 text-sm bg-[var(--card-bg)] p-2 rounded">
                    💬 <strong>{topComment.author}</strong>: {topComment.content}
                  </div>
                )}

                {user ? (
                  <form onSubmit={(e) => handleCommentSubmit(e, recipe.id)} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={commentInputs[recipe.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((p) => ({ ...p, [recipe.id]: e.target.value }))
                      }
                      placeholder="댓글을 입력하세요"
                      className="flex-1 text-sm px-3 py-1 border border-[var(--border-color)] rounded bg-transparent"
                    />
                    <button
                      type="submit"
                      className="text-sm px-3 py-1 bg-[var(--header-bg)] text-[var(--foreground)] rounded hover:brightness-110 active:scale-95 transition"
                    >
                      등록
                    </button>
                  </form>
                ) : (
                  <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                    ※ 로그인 후 댓글을 작성할 수 있습니다.
                  </p>
                )}

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
