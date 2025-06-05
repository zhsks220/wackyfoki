'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from 'framer-motion';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

/**
 * LikeButton 컴포넌트
 * @param {string} path - Firestore 문서 경로 (예: 'recipes/abc123' 또는 'recipes/abc123/comments/comment456')
 * @param {string} uid - 현재 로그인한 유저의 UID
 * @param {string[]} likedBy - 현재 좋아요 누른 사람 UID 배열
 * @param {number} likes - 현재 좋아요 개수
 * @param {function} onChange - 상태 갱신 시 실행할 콜백 (likedBy, likes 전달)
 */
export default function LikeButton({ path, uid, likedBy = [], likes = 0, onChange }) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(likes);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setLiked(uid ? likedBy.includes(uid) : false);
    setCount(likes);
  }, [uid, likedBy, likes]);

  const handleLike = async () => {
    if (!uid) {
      alert('로그인 후 좋아요를 누를 수 있습니다.');
      return;
    }

    const ref = doc(db, path);
    const isLiked = liked;
    const newLikedBy = isLiked
      ? likedBy.filter(id => id !== uid)
      : [...likedBy, uid];
    const newCount = isLiked ? count - 1 : count + 1;

    try {
      // 로컬 상태 업데이트
      setLiked(!isLiked);
      setCount(newCount);
      setAnimating(true);

      // Firestore 업데이트
      await updateDoc(ref, {
        likedBy: isLiked ? arrayRemove(uid) : arrayUnion(uid),
        likes: newCount,
      });

      // 외부 상태 반영
      onChange?.(newLikedBy, newCount);
    } catch (err) {
      console.error('좋아요 처리 오류:', err);
      alert('좋아요 처리 중 오류가 발생했습니다.');
      // 롤백
      setLiked(isLiked);
      setCount(count);
    }
  };

  return (
    <button
      onClick={handleLike}
      style={{
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: 0,
        marginTop: '0.5rem',
      }}
    >
      <motion.span
        animate={{ scale: animating ? 1.3 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 10 }}
        onAnimationComplete={() => setAnimating(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          color: liked ? 'rgb(239 68 68)' : '#888',
          fontSize: '1rem',
        }}
      >
        {liked ? <FaHeart /> : <FaRegHeart />}
        <span style={{ fontSize: '0.9rem' }}>{count}</span>
      </motion.span>
    </button>
  );
}
