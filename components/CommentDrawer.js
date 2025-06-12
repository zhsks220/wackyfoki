'use client';

import { useEffect, useState } from 'react';
import {
  onSnapshot,
  collection,
  query,
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import LikeButton from './LikeButton';
import { useTranslation } from 'next-i18next';

export default function CommentDrawer({
  recipeId,
  open,
  onClose,
  user,
  onDelete,
}) {
  const { t } = useTranslation('common');
  const [comments, setComments] = useState([]);
  const [nicknames, setNicknames] = useState({}); // ✅ uid → 닉네임 캐시

  /* ───────── 실시간 댓글 스트림 ───────── */
  useEffect(() => {
    if (!recipeId || !open) return;

    const q = query(
      collection(db, `recipes/${recipeId}/comments`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setComments(docs);

      // ✅ uid 중복 제거 후 닉네임 요청
      const uniqueUids = [...new Set(docs.map((d) => d.uid))];

      const nicknameMap = {};
      await Promise.all(
        uniqueUids.map(async (uid) => {
          if (!uid) return;
          const userRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            nicknameMap[uid] = userSnap.data().displayName || t('anonymous');
          } else {
            nicknameMap[uid] = t('anonymous');
          }
        })
      );
      setNicknames(nicknameMap);
    });

    return () => unsubscribe();
  }, [recipeId, open, t]);

  if (!open) return null;

  return (
    <div
      className="fixed top-0 right-0 w-[400px] h-full shadow-lg z-50 p-4 overflow-y-auto"
      style={{
        backgroundColor: 'var(--card-bg)',
        color: 'var(--card-text)',
        borderLeft: '1px solid var(--border-color)',
      }}
    >
      {/* ── 헤더 ── */}
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-bold">💬 {t('see_all_comments')}</h2>
        <button
          onClick={onClose}
          className="text-sm text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
        >
          {t('close')}
        </button>
      </div>

      {/* ── 댓글 목록 ── */}
      {comments.length === 0 ? (
        <p style={{ color: 'var(--border-color)' }}>{t('no_comment')}</p>
      ) : (
        comments.map((c) => {
          const isAuthor = user && c.uid === user.uid;
          const displayName = nicknames[c.uid] || t('anonymous');

          return (
            <div
              key={c.id}
              className="border-b py-2 flex justify-between items-start"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex-1">
                <p className="font-semibold text-sm">{displayName}</p>
                <p className="text-sm mb-1 whitespace-pre-wrap">{c.content}</p>

                <LikeButton
                  path={`recipes/${recipeId}/comments/${c.id}`}
                  uid={user?.uid}
                  likedBy={c.likedBy || []}
                  likes={c.likes || 0}
                />
              </div>

              {isAuthor && (
                <button
                  onClick={() => onDelete(recipeId, c.id)}
                  className="text-xs text-gray-400 hover:text-red-600 ml-2"
                >
                  {t('delete')}
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
