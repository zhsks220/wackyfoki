// pages/recipe/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function RecipeDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchRecipe = async () => {
      try {
        const docRef = doc(db, 'recipes', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setRecipe({ id: docSnap.id, ...docSnap.data() });
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
  }, [id]);

  if (loading) return <p style={{ padding: '2rem' }}>⏳ 로딩 중...</p>;
  if (!recipe) return <p style={{ padding: '2rem' }}>😢 레시피를 찾을 수 없습니다.</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{recipe.title}</h1>
      <img
        src={recipe.imageUrl}
        alt={recipe.title}
        style={{ width: '100%', height: 'auto', borderRadius: 8, marginBottom: '1rem' }}
      />
      <p style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>{recipe.description}</p>
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
  );
}
