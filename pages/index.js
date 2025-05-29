'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase/config';
import { useRouter } from 'next/router';
import { useUser } from '../contexts/UserContext';
import CommentDrawer from '../components/CommentDrawer';
import { UploadCloud, X } from 'lucide-react';

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
  const [drawerRecipeId, setDrawerRecipeId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadImage, setUploadImage] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const { user } = useUser();
  const router = useRouter();

  const fetchRecipes = async () => {
    const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const baseData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

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
      })
    );

    setRecipes(updatedData);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

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
        r.id === recipeId ? { ...r, likedBy: newLikedBy, likes: newLikedBy.length } : r
      )
    );
  };

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

  const deleteComment = async (recipeId, commentId) => {
    if (!user?.uid) return;
    const ok = confirm('정말로 댓글을 삭제하시겠습니까?');
    if (!ok) return;
    await deleteDoc(doc(db, 'recipes', recipeId, 'comments', commentId));
    await fetchTopComment(recipeId);
  };

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

  const handleUpload = async () => {
    if (!uploadTitle || !uploadDesc) {
      alert('제목과 설명을 입력해주세요.');
      return;
    }

    if (
      uploadUrl.trim() !== '' &&
      !uploadUrl.includes('youtube.com') &&
      !uploadUrl.includes('youtu.be')
    ) {
      alert('YouTube 링크가 올바르지 않습니다.');
      return;
    }

    setUploading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('로그인 필요');

      const { displayName, uid, photoURL } = currentUser;
      let imageUrl = '';
      if (uploadImage) {
        const imageRef = ref(storage, `images/${uploadImage.name}-${Date.now()}`);
        const snapshot = await uploadBytes(imageRef, uploadImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'recipes'), {
        title: uploadTitle,
        description: uploadDesc,
        youtubeUrl: uploadUrl.trim() || '',
        imageUrl,
        createdAt: serverTimestamp(),
        authorName: displayName || '익명',
        authorImage: user?.profileImage || photoURL || '',
        uid,
      });

      setModalOpen(false);
      setUploadTitle('');
      setUploadDesc('');
      setUploadUrl('');
      setUploadImage(null);
      setUploadPreview('');
      await fetchRecipes();
    } catch (err) {
      alert('업로드 실패');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
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
             bg-[var(--input-bg)] text-[var(--foreground)]
             hover:brightness-95 dark:hover:brightness-110
             transition"
            >
              어떤 레시피를 공유하시겠습니까?
            </button>
          </div>

          {/* ✅ 여기에 버튼 두 개 추가 */}
          <div className="flex justify-center">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1 cursor-pointer hover:text-blue-500 transition"
            >
              🖼️ <span>사진 및 유튜브</span>
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl w-full max-w-md relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X />
            </button>

            <h2 className="text-lg font-bold mb-4">🍽️ 괴식 레시피 업로드</h2>
            <input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="제목"
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800 mb-2"
            />
            <textarea
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              placeholder="설명"
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800 mb-2"
              rows={3}
            />
            <input
              value={uploadUrl}
              onChange={(e) => setUploadUrl(e.target.value)}
              placeholder="YouTube 링크 (선택)"
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800 mb-2"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setUploadImage(file);
                setUploadPreview(file ? URL.createObjectURL(file) : '');
              }}
              className="mb-2"
            />
            {uploadPreview && (
              <img
                src={uploadPreview}
                alt="preview"
                className="w-full rounded mb-2 max-h-60 object-cover"
              />
            )}

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex justify-center items-center gap-2"
            >
              {uploading ? '⏳ 업로드 중...' : <><UploadCloud size={18} /> 업로드</>}
            </button>
          </div>
        </div>
      )}

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
          const liked = user?.uid && recipe.likedBy?.includes(user.uid);
          const topComment = topComments[recipe.id];

          return (
            <div key={recipe.id} className="bg-[var(--card-bg)] text-[var(--card-text)] rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={recipe.authorImage || '/default-avatar.png'}
                  alt={recipe.authorName || '익명'}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="font-medium text-sm">{recipe.authorName || '익명'}</span>
              </div>

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
                recipe.imageUrl && (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="w-full rounded-md mb-4"
                  />
                )
              )}

              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => toggleRecipeLike(recipe.id)} className="text-2xl">
                  {liked ? '❤️' : '🤍'}
                </button>
                <span className="text-sm opacity-70">좋아요 {recipe.likes || 0}개</span>
              </div>

              <button
                onClick={() => router.push(`/recipe/${recipe.id}`)}
                className="text-sm px-4 py-1 rounded 
             bg-[var(--input-bg)] text-[var(--foreground)] 
             hover:brightness-95 dark:hover:brightness-110 
             transition"
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
                        setCommentInputs((prev) => ({
                          ...prev,
                          [recipe.id]: e.target.value,
                        }))
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
