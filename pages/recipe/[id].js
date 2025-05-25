import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useUser } from '@/contexts/UserContext';

export default function RecipeDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const user = useUser();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // 🔹 레시피 + 좋아요 상태 불러오기
  useEffect(() => {
    if (!id) return;

    const fetchRecipe = async () => {
      try {
        const docRef = doc(db, 'recipes', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setRecipe({ id: docSnap.id, ...docSnap.data() });

          const likesRef = collection(db, 'recipes', id, 'likes');
          const snapshot = await getDocs(likesRef);
          setLikeCount(snapshot.size);

          if (user) {
            const userLike = snapshot.docs.find(doc => doc.id === user.uid);
            setLiked(!!userLike);
          }
        } else {
          setRecipe(null);
        }
      } catch (error) {
        console.error('오류 발생:', error);
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id, user]);

  // 🔹 좋아요 토글
  const toggleLike = async () => {
    if (!user) {
      alert('로그인 후 좋아요를 누를 수 있습니다.');
      return;
    }

    const likeRef = doc(db, 'recipes', id, 'likes', user.uid);

    try {
      if (liked) {
        await deleteDoc(likeRef);
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await setDoc(likeRef, {
          liked: true,
          timestamp: new Date(),
        });
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('좋아요 처리 실패:', err);
      alert('좋아요 처리 중 오류 발생');
    }
  };

  if (loading) return <p style={{ padding: '2rem' }}>⏳ 로딩 중...</p>;
  if (!recipe) return <p style={{ padding: '2rem' }}>😢 레시피를 찾을 수 없습니다.</p>;

  return (
    <>
      <Head>
        <title>{recipe.title} - WackyFoki</title>
      </Head>
      <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{recipe.title}</h1>

        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: 8,
              marginBottom: '1rem',
              backgroundColor: '#222',
            }}
          />
        ) : (
          <p style={{ fontStyle: 'italic', color: '#aaa' }}>이미지가 없습니다.</p>
        )}

        <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>{recipe.description}</p>

        {/* 🔹 좋아요 버튼 및 수 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={toggleLike}
            style={{
              fontSize: '1.2rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: liked ? 'red' : 'gray',
              marginRight: 8,
            }}
          >
            {liked ? '❤️' : '🤍'}
          </button>
          <span style={{ fontSize: '0.95rem', color: '#555' }}>
            {likeCount}명이 좋아요를 눌렀어요
          </span>
        </div>

        {recipe.youtubeUrl && (
          <a
            href={recipe.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ff4444',
              color: '#fff',
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            ▶️ 유튜브에서 영상 보기
          </a>
        )}
      </div>
    </>
  );
}
