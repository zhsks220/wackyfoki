'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  startAfter,
  getDocs,
  doc,
  getDoc,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import LikeButton from './LikeButton';
import { useTranslation } from 'next-i18next';

export default function CommentDrawer({ recipeId, open, onClose, user, onDelete }) {
  const { t } = useTranslation('common');
  const containerRef = useRef(null);

  const [comments, setComments] = useState([]);
  const [nicknames, setNicknames] = useState({});
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [ready, setReady] = useState(false);

  const PAGE_SIZE = 10;

  const fetchComments = useCallback(async () => {
    if (!recipeId || isFetching || !hasMore) return;
    setIsFetching(true);

    try {
      const baseQuery = query(
        collection(db, `recipes/${recipeId}/comments`),
        orderBy('createdAt', 'asc'),
        ...(lastDoc ? [startAfter(lastDoc)] : []),
        limit(PAGE_SIZE)
      );

      const snap = await getDocs(baseQuery);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      setComments(prev => [...prev, ...docs]);
      setLastDoc(snap.docs[snap.docs.length - 1]);

      if (snap.docs.length < PAGE_SIZE) {
        setHasMore(false);
      }

      const uniqueUids = [...new Set(docs.map(d => d.uid))];
      const nicknameMap = {};
      await Promise.all(
        uniqueUids.map(async (uid) => {
          if (!uid || nicknames[uid]) return;
          const userRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userRef);
          nicknameMap[uid] = userSnap.exists()
            ? userSnap.data().displayName || t('anonymous')
            : t('anonymous');
        })
      );
      setNicknames(prev => ({ ...prev, ...nicknameMap }));
    } catch (err) {
      console.error('댓글 불러오기 오류:', err);
    } finally {
      setIsFetching(false);
      setReady(true);
    }
  }, [recipeId, isFetching, hasMore, lastDoc, nicknames, t]);

  useEffect(() => {
    if (open) {
      setComments([]);
      setNicknames({});
      setLastDoc(null);
      setHasMore(true);
      setReady(false);
    }
  }, [recipeId, open]);

  useEffect(() => {
    if (open) {
      fetchComments();
    }
  }, [fetchComments, open]);

  // ✅ 스크롤 방지 처리
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container || !hasMore || isFetching) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (
      scrollTop + clientHeight >= scrollHeight - 50 &&
      scrollHeight > clientHeight + 10
    ) {
      fetchComments();
    }
  };

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="fixed top-0 right-0 w-[400px] h-full shadow-lg z-50 p-4 overflow-y-auto no-scrollbar"
      style={{
        backgroundColor: 'var(--card-bg)',
        color: 'var(--card-text)',
        borderLeft: '1px solid var(--border-color)',
      }}
    >
      {/* 헤더 */}
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-bold">💬 {t('see_all_comments')}</h2>
        <button
          onClick={onClose}
          className="text-sm text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
        >
          {t('close')}
        </button>
      </div>

      {/* 로딩 중 */}
      {!ready ? (
        <p className="text-center text-sm text-gray-400 mt-2">{t('loading')}...</p>
      ) : comments.length === 0 ? (
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

      {isFetching && ready && (
        <p className="text-center text-sm text-gray-400 mt-2">{t('loading')}...</p>
      )}
    </div>
  );
}
