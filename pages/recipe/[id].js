'use client';

import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useUser } from '@/contexts/UserContext';

export default function RecipeDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  // 🔄 레시피 로딩
  const fetchRecipe = useCallback(async () => {
    if (!id) return;

    setLoading(true);

    try {
      const docRef = doc(db, 'recipes', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const isLiked = user?.uid && data.likedBy?.includes(user.uid);
        setRecipe({ id: docSnap.id, ...data });
        setLiked(!!isLiked);
      } else {
        setRecipe(null);
      }
    } catch (err) {
      console.error('레시피 로딩 실패:', err);
      setRecipe(null);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchRecipe();
  }, [fetchRecipe]);

  // ❤️ 좋아요 토글
  const toggleLike = async () => {
    if (!user?.uid || !recipe) {
      alert('로그인 후 좋아요를 누를 수 있습니다.');
      return;
    }

    const recipeRef = doc(db, 'recipes', recipe.id);
    const isLiked = recipe.likedBy?.includes(user.uid);
    const newLikedBy = isLiked
      ? recipe.likedBy.filter(uid => uid !== user.uid)
      : [...(recipe.likedBy || []), user.uid];

    try {
      await updateDoc(recipeRef, {
        likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
        likes: newLikedBy.length,
      });

      setRecipe(prev =>
        prev ? { ...prev, likedBy: newLikedBy, likes: newLikedBy.length } : prev
      );
      setLiked(!isLiked);
    } catch (err) {
      console.error('좋아요 처리 중 오류:', err);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  // 🕗 로딩 or 오류
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

        {/* 👍 좋아요 영역 */}
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
            {recipe.likes || 0}명이 좋아요를 눌렀어요
          </span>
        </div>

        {/* ▶ 유튜브 링크 */}
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
