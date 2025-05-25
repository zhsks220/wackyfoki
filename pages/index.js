import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useRouter } from 'next/router';
import { useUser } from '../contexts/UserContext';

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
  const router = useRouter();
  const user = useUser();

  useEffect(() => {
    const fetchRecipes = async () => {
      const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setRecipes(data);
    };

    fetchRecipes();
  }, []);

  const handleLike = async (recipeId) => {
    if (!user) {
      alert('로그인 후 이용 가능합니다.');
      return;
    }

    const recipeRef = doc(db, 'recipes', recipeId);
    const recipe = recipes.find((r) => r.id === recipeId);
    const liked = recipe.likedBy?.includes(user.uid);

    const updatedLikedBy = liked
      ? recipe.likedBy.filter((uid) => uid !== user.uid)
      : [...(recipe.likedBy || []), user.uid];

    const updatedLikes = updatedLikedBy.length;

    await updateDoc(recipeRef, {
      likedBy: updatedLikedBy,
      likes: updatedLikes,
    });

    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId
          ? { ...r, likedBy: updatedLikedBy, likes: updatedLikes }
          : r
      )
    );
  };

  return (
    <div className="p-8 max-w-3xl mx-auto bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-4">🍽️ 워키포키 괴식 피드</h1>

      {user ? (
        <p className="text-orange-500 mb-6">
          🔥 {user.displayName || user.email}님, 환영합니다!
        </p>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          로그인하지 않으셨습니다.
        </p>
      )}

      {recipes.length === 0 && <p>업로드된 괴식이 아직 없어요!</p>}

      <div className="flex flex-col gap-6">
        {recipes.map((recipe) => {
          const videoId = extractYouTubeId(recipe.youtubeUrl);
          const liked = user && recipe.likedBy?.includes(user.uid);

          return (
            <div
              key={recipe.id}
              className="bg-[var(--card-bg)] text-[var(--card-text)] rounded-xl shadow-md p-6 transition hover:scale-[1.01]"
            >
              <h2 className="text-lg font-semibold mb-1">{recipe.title}</h2>
              <p className="mb-4">{recipe.description}</p>

              {videoId && (
                <div className="relative pb-[56.25%] h-0 mb-4">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full rounded-md"
                  />
                </div>
              )}

              {!videoId && recipe.imageUrl && (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-full h-auto rounded-md object-cover mb-4"
                />
              )}

              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => handleLike(recipe.id)}
                  className="text-2xl"
                >
                  {liked ? '❤️' : '🤍'}
                </button>
                <span className="text-sm text-[var(--card-text)] opacity-70">
                  좋아요 {recipe.likes || 0}개
                </span>
              </div>

              <button
                onClick={() => router.push(`/recipe/${recipe.id}`)}
                className="text-sm bg-black text-white px-4 py-1 rounded hover:bg-gray-800"
              >
                👉 상세 보기
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
