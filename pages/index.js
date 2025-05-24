import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useRouter } from 'next/router';

export default function HomePage() {
  const [recipes, setRecipes] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchRecipes = async () => {
      const q = query(collection(db, 'recipes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecipes(data);
    };

    fetchRecipes();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>🍽️ 워키포키 괴식 피드</h1>
      {recipes.length === 0 && <p>업로드된 괴식이 아직 없어요!</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {recipes.map(recipe => (
          <div
            key={recipe.id}
            onClick={() => router.push(`/recipe/${recipe.id}`)}
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              overflow: 'hidden',
              padding: '1rem',
              backgroundColor: '#fff',
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
          >
            <img src={recipe.imageUrl} alt={recipe.title} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
            <h3 style={{ marginTop: '1rem' }}>{recipe.title}</h3>
            <p>{recipe.description.slice(0, 60)}...</p>
            {recipe.youtubeUrl && (
              <span style={{ display: 'inline-block', marginTop: '0.5rem', color: 'gray', fontSize: '0.9rem' }}>
                🎬 유튜브 링크 있음
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
