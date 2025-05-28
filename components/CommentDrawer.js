'use client';

import { useEffect, useState } from 'react';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function CommentDrawer({
  recipeId,
  open,
  onClose,
  user,
  onDelete,
  onLike,
}) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!recipeId || !open) return;

    const q = query(
      collection(db, `recipes/${recipeId}/comments`),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [recipeId, open]);

  if (!open) return null;

  return (
    <div className="fixed top-0 right-0 w-[400px] h-full bg-white dark:bg-zinc-900 shadow-lg z-50 p-4 overflow-y-auto">
      <button
        onClick={onClose}
        className="text-sm text-gray-500 hover:text-black dark:hover:text-white float-right"
      >
        닫기 ✖
      </button>
      <h2 className="text-lg font-bold mb-4">💬 댓글 전체 보기</h2>

      {comments.length === 0 ? (
        <p className="text-gray-500">댓글이 없습니다.</p>
      ) : (
        comments.map((c) => {
          const liked = user && c.likedBy?.includes(user.uid);
          const isAuthor = user && c.uid === user.uid;

          return (
            <div
              key={c.id}
              className="border-b border-gray-300 dark:border-gray-700 py-2 flex justify-between items-start"
            >
              <div className="flex-1">
                <p className="font-semibold text-sm">{c.author || '익명'}</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">
                  {c.content}
                </p>
                <button
                  onClick={() => onLike(recipeId, c)}
                  className="text-xs text-red-500 hover:underline"
                >
                  {liked ? '❤️' : '🤍'} {c.likes}
                </button>
              </div>

              {isAuthor && (
                <button
                  onClick={() => onDelete(recipeId, c.id)}
                  className="text-xs text-gray-400 hover:text-red-600 ml-2"
                >
                  삭제
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
