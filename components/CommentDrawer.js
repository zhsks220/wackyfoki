/* components/CommentDrawer.js */
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  collection, query, orderBy, startAfter, getDocs, addDoc,
  doc, getDoc, deleteDoc, updateDoc, limit, serverTimestamp,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../firebase/config';
import LikeButton from './LikeButton';
import { useTranslation } from 'next-i18next';

/* ===== 날짜 포맷 util (RecipeCard 와 동일) ======================= */
function formatSmartTime(date, t) {
  const now     = new Date();
  const diff    = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);
  const weeks   = Math.floor(days / 7);
  const months  = Math.floor(days / 30);
  const years   = Math.floor(days / 365);

  if (years  >= 1) return t('time_year',   { count: years  });
  if (months >= 1) return t('time_month',  { count: months });
  if (weeks  >= 1) return t('time_week',   { count: weeks  });
  if (days   >= 1) return t('time_day',    { count: days   });
  if (hours  >= 1) return t('time_hour',   { count: hours  });
  if (minutes>= 1) return t('time_minute', { count: minutes});
  return t('time_just_now');
}

/* ===========================================================
   댓글 · 대댓글 Drawer
=========================================================== */
export default function CommentDrawer({ recipeId, open, onClose, user }) {
  const { t } = useTranslation('common');

  /* ---------- refs ---------- */
  const containerRef = useRef(null);
  const fetchVerRef  = useRef(0);
  const lastDocRef   = useRef(null);

  /* ---------- states ---------- */
  const [comments,   setComments]   = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nicknames,  setNicknames]  = useState({});
  const [hasMore,    setHasMore]    = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [ready,      setReady]      = useState(false);

  const [sortBy,     setSortBy]     = useState('top'); // 'top' | 'newest'

  const [repliesCount, setRepliesCount] = useState({});
  const [showReply,    setShowReply]    = useState({});
  const [replyInput,   setReplyInput]   = useState({});
  const [repliesMap,   setRepliesMap]   = useState({});

  const [menuOpen,     setMenuOpen]     = useState({});
  const [editingMap,   setEditingMap]   = useState({});
  const [editInputMap, setEditInputMap] = useState({});

  const [newComment,   setNewComment]   = useState('');

  const PAGE_SIZE = 10;

  /* ---------------------------------------------------------
     총 개수
  --------------------------------------------------------- */
  const fetchTotalCount = useCallback(async () => {
    if (!recipeId) return;
    try {
      const coll      = collection(db, `recipes/${recipeId}/comments`);
      const countSnap = await getCountFromServer(coll);
      setTotalCount(countSnap.data().count);
    } catch (e) {
      console.error('댓글 개수 조회 오류:', e);
    }
  }, [recipeId]);

  /* ---------------------------------------------------------
     Firestore helpers
  --------------------------------------------------------- */

  /* 1. reply 개수 */
  const fetchRepliesCount = async (commentDocs) => {
    const counts = {};
    await Promise.all(
      commentDocs.map(async (c) => {
        const snap = await getDocs(
          collection(db, `recipes/${recipeId}/comments/${c.id}/replies`)
        );
        counts[c.id] = snap.size;
      }),
    );
    setRepliesCount((p) => ({ ...p, ...counts }));
  };

  /* 2. reply 목록 */
  const fetchReplies = async (commentId) => {
    const snap = await getDocs(
      query(
        collection(db, `recipes/${recipeId}/comments/${commentId}/replies`),
        orderBy('createdAt', 'asc'),
      ),
    );
    const replies = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    /* 작성자 이름 캐싱 */
    const names = {};
    await Promise.all(
      replies.map(async (r) => {
        if (!r.uid || nicknames[r.uid]) return;
        const uSnap = await getDoc(doc(db, 'users', r.uid));
        names[r.uid] = uSnap.exists()
          ? uSnap.data().displayName || t('anonymous')
          : t('anonymous');
      }),
    );
    setNicknames((p) => ({ ...p, ...names }));
    setRepliesMap((p) => ({ ...p, [commentId]: replies }));
  };

  /* 3. comment 목록 */
  const fetchComments = useCallback(async () => {
    if (!recipeId || isFetching || !hasMore) return;
    const myVer = fetchVerRef.current;
    setIsFetching(true);

    try {
      const order = sortBy === 'top'
        ? [orderBy('likes', 'desc'), orderBy('createdAt', 'desc')]
        : [orderBy('createdAt', 'desc')];

      const q = query(
        collection(db, `recipes/${recipeId}/comments`),
        ...order,
        ...(lastDocRef.current ? [startAfter(lastDocRef.current)] : []),
        limit(PAGE_SIZE),
      );

      const snap = await getDocs(q);
      if (myVer !== fetchVerRef.current) return;

      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setComments(prev =>
        lastDocRef.current ? [...prev, ...docs] : docs
      );

      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
      if (snap.docs.length < PAGE_SIZE) setHasMore(false);

      /* 작성자 이름 캐싱 */
      const uids = [...new Set(docs.map((d) => d.uid))];
      const nameMap = {};
      await Promise.all(
        uids.map(async (uid) => {
          if (!uid || nicknames[uid]) return;
          const uSnap = await getDoc(doc(db, 'users', uid));
          nameMap[uid] = uSnap.exists()
            ? uSnap.data().displayName || t('anonymous')
            : t('anonymous');
        }),
      );
      setNicknames((p) => ({ ...p, ...nameMap }));

      await fetchRepliesCount(docs);
    } catch (e) {
      console.error('댓글 불러오기 오류:', e);
    } finally {
      setIsFetching(false);
      setReady(true);
    }
  }, [recipeId, sortBy, isFetching, hasMore, nicknames, t]);

  /* ---------------------------------------------------------
     CRUD helpers
  --------------------------------------------------------- */

  /* 댓글 추가 */
  const handleAddComment = async () => {
    const content = newComment.trim();
    if (!user) {          // 🟢 로그인 안 된 경우
      alert(t('login_required'));
      return;
    }
    if (!content) return;

    try {
      const docRef = await addDoc(
        collection(db, `recipes/${recipeId}/comments`),
        {
          uid: user.uid,
          content,
          likes: 0,
          likedBy: [],
          createdAt: serverTimestamp(),
        }
      );

      /* 낙관적 UI */
      const optimistic = {
        id:        docRef.id,
        uid:       user.uid,
        content,
        likes:     0,
        likedBy:   [],
        createdAt: new Date(),
      };
      setComments(p => [optimistic, ...p]);
      setRepliesCount(p => ({ ...p, [docRef.id]: 0 }));
      setNewComment('');

      /* 전체 개수 +1 */
      setTotalCount(c => c + 1);

      resetState();
      fetchComments();
    } catch (e) {
      console.error('댓글 추가 오류:', e);
    }
  };

  /* 답글 추가 */
  const handleReplySubmit = async (parentId) => {
    const content = (replyInput[parentId] || '').trim();
    if (!user) {
      alert(t('login_required'));   // 🟢 비로그인 경고
      return;
    }
    if (!content) return;

    try {
      const colRef = collection(
        db,
        `recipes/${recipeId}/comments/${parentId}/replies`
      );
      const docRef = await addDoc(colRef, {
        uid:       user.uid,
        content,
        likes:     0,
        likedBy:   [],
        createdAt: serverTimestamp(),
      });

      const optimistic = {
        id:        docRef.id,
        uid:       user.uid,
        content,
        likes:     0,
        likedBy:   [],
        createdAt: new Date(),
      };
      setRepliesMap(prev => ({
        ...prev,
        [parentId]: prev[parentId] ? [...prev[parentId], optimistic] : [optimistic],
      }));
      setRepliesCount(prev => ({
        ...prev,
        [parentId]: (prev[parentId] || 0) + 1,
      }));
      setReplyInput(prev => ({ ...prev, [parentId]: '' }));
      setShowReply(prev => ({ ...prev, [parentId]: true }));
    } catch (e) {
      console.error('답글 등록 오류:', e);
    }
  };

  /* 댓글/답글 수정 */
  const updateComment = async (id, newContent, isReply = false, parentId = null) => {
    if (!newContent) return;
    const path = isReply
      ? `recipes/${recipeId}/comments/${parentId}/replies/${id}`
      : `recipes/${recipeId}/comments/${id}`;
    try {
      await updateDoc(doc(db, path), {
        content: newContent,
        updatedAt: serverTimestamp(),
      });

      if (isReply) {
        setRepliesMap(prev => ({
          ...prev,
          [parentId]: prev[parentId].map(r =>
            r.id === id ? { ...r, content: newContent } : r
          ),
        }));
      } else {
        setComments(prev =>
          prev.map(c => (c.id === id ? { ...c, content: newContent } : c))
        );
      }
      setEditingMap(prev => ({ ...prev, [id]: false }));
    } catch (e) {
      console.error('수정 오류:', e);
    }
  };

  /* 댓글 삭제 (+ 하위 답글) */
  const deleteCommentWithReplies = async (commentId) => {
    try {
      /* 하위 reply 모두 삭제 */
      const replySnap = await getDocs(
        collection(db, `recipes/${recipeId}/comments/${commentId}/replies`)
      );
      await Promise.all(replySnap.docs.map(d => deleteDoc(d.ref)));
      /* 댓글 삭제 */
      await deleteDoc(doc(db, `recipes/${recipeId}/comments/${commentId}`));

      setComments(prev => prev.filter(c => c.id !== commentId));
      setRepliesCount(prev => {
        const { [commentId]: _, ...rest } = prev;
        return rest;
      });
      setTotalCount(c => (c > 0 ? c - 1 : 0));
    } catch (e) {
      console.error('댓글 삭제 오류:', e);
    }
  };

  /* 답글 삭제 */
  const deleteReply = async (commentId, replyId) => {
    try {
      await deleteDoc(
        doc(db, `recipes/${recipeId}/comments/${commentId}/replies/${replyId}`)
      );
      setRepliesMap(prev => ({
        ...prev,
        [commentId]: prev[commentId].filter(r => r.id !== replyId),
      }));
      setRepliesCount(prev => ({
        ...prev,
        [commentId]: (prev[commentId] || 1) - 1,
      }));
    } catch (e) {
      console.error('답글 삭제 오류:', e);
    }
  };

  /* ---------------------------------------------------------
     reset & effect
  --------------------------------------------------------- */
  const resetState = () => {
    setComments([]);
    setHasMore(true);
    setReady(false);
    setIsFetching(false);
    fetchVerRef.current++;
    lastDocRef.current = null;
    setMenuOpen({});
    setEditingMap({});
    setShowReply({});
    setReplyInput({});
    setRepliesMap({});
  };

  useEffect(() => {
    if (!open) return;
    resetState();
    fetchTotalCount();
  }, [recipeId, open, sortBy, fetchTotalCount]);

  useEffect(() => {
    if (open && !ready) fetchComments();
  }, [open, ready, fetchComments]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, [open]);

  const onScroll = () => {
    const c = containerRef.current;
    if (!c || !hasMore || isFetching) return;
    if (c.scrollTop + c.clientHeight >= c.scrollHeight - 50) fetchComments();
  };

  if (!open) return null;

  /* ---------------------------------------------------------
     render
  --------------------------------------------------------- */
  return (
    <>
      {/* === Drawer ===================================================== */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        className="fixed top-0 right-0 w-[400px] h-full shadow-lg z-50 p-4 pb-24 overflow-y-auto no-scrollbar"
        style={{
          backgroundColor: 'var(--card-bg)',
          color: 'var(--card-text)',
          borderLeft: '1px solid var(--border-color)',
        }}
      >
        {/* header */}
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-bold">
            💬 {t('see_all_comments')} ({totalCount})
          </h2>
          <button
            onClick={onClose}
            className="text-sm text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
          >
            {t('close')}
          </button>
        </div>

        {/* sort toggle */}
        <div className="flex gap-2 mb-4 text-xs">
          <button
            onClick={() => sortBy !== 'top'   && setSortBy('top')}
            className={`px-2 py-1 rounded border ${sortBy === 'top' ? 'font-semibold' : ''}`}
            style={{ borderColor: 'var(--border-color)' }}
          >
            {t('top_comments')}
          </button>
          <button
            onClick={() => sortBy !== 'newest' && setSortBy('newest')}
            className={`px-2 py-1 rounded border ${sortBy === 'newest' ? 'font-semibold' : ''}`}
            style={{ borderColor: 'var(--border-color)' }}
          >
            {t('newest_first')}
          </button>
        </div>

        {/* list */}
        {!ready ? (
          <p className="text-center text-sm text-gray-400 mt-2">{t('loading')}</p>
        ) : comments.length === 0 ? (
          <p style={{ color: 'var(--border-color)' }}>{t('no_comment')}</p>
        ) : (
          comments.map((c) => {
            const isAuthor    = user && c.uid === user.uid;
            const displayName = nicknames[c.uid] || t('anonymous');
            const replyCount  = repliesCount[c.id] || 0;
            const createdStr  =
              c.createdAt?.toDate
                ? formatSmartTime(c.createdAt.toDate(), t)
                : '';

            return (
              <div
                key={c.id}
                className="border-b py-2"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {/* ---------- comment row ---------- */}
                <div className="flex justify-between">
                  {/* body */}
                  <div className="flex-1 pr-2">
                    {editingMap[c.id] ? (
                      <>
                        <textarea
                          className="w-full text-sm border rounded p-1 mb-1"
                          rows={2}
                          value={editInputMap[c.id] || ''}
                          onChange={(e) =>
                            setEditInputMap((p) => ({ ...p, [c.id]: e.target.value }))
                          }
                        />
                        <div className="flex gap-2 text-xs">
                          <button
                            onClick={() =>
                              updateComment(c.id, (editInputMap[c.id] || '').trim())
                            }
                            className="px-3 py-1 rounded border"
                            style={{ borderColor: 'var(--border-color)' }}
                          >
                            {t('save')}
                          </button>
                          <button
                            onClick={() =>
                              setEditingMap((p) => ({ ...p, [c.id]: false }))
                            }
                            className="px-3 py-1 rounded border"
                            style={{ borderColor: 'var(--border-color)' }}
                          >
                            {t('cancel')}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-sm">
                          {displayName}{' '}
                          <span className="text-gray-500 text-xs font-normal">· {createdStr}</span>
                        </p>
                        <p className="text-sm mb-1 whitespace-pre-wrap">{c.content}</p>
                      </>
                    )}
                  </div>

                  {/* menu */}
                  {isAuthor && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setMenuOpen((p) => ({ ...p, [c.id]: !p[c.id] }))
                        }
                      >
                        ⋯
                      </button>
                      {menuOpen[c.id] && (
                        <div
                          className="absolute right-0 mt-1 rounded shadow text-sm z-10"
                          style={{ backgroundColor: 'var(--dropdown-bg)', border: '1px solid var(--border-color)' }}>
                          <button
                            onClick={() => {
                              setEditingMap((p) => ({ ...p, [c.id]: true }));
                              setEditInputMap((p) => ({ ...p, [c.id]: c.content }));
                              setMenuOpen((p) => ({ ...p, [c.id]: false }));
                            }}
                            className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 w-full text-left"
                          >
                            {t('edit')}
                          </button>
                          <button
                            onClick={() => deleteCommentWithReplies(c.id)}
                            className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 w-full text-left"
                          >
                            {t('delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* like & reply */}
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <LikeButton
                    path={`recipes/${recipeId}/comments/${c.id}`}
                    uid={user?.uid}
                    likedBy={c.likedBy || []}
                    likes={c.likes || 0}
                  />
                  <button
                    onClick={() => {
                      setShowReply((p) => ({ ...p, [c.id]: !p[c.id] }));
                      if (!repliesMap[c.id]) fetchReplies(c.id);
                    }}
                    className="hover:underline"
                  >
                    {showReply[c.id]
                      ? t('hide_replies')
                      : replyCount > 0
                      ? `${t('reply')} ${replyCount}`
                      : t('reply')}
                  </button>
                </div>

                {/* reply textarea */}
                {showReply[c.id] && (
                  <div className="mt-2">
                    <textarea
                      placeholder={t('write_reply')}
                      className="w-full text-sm border rounded p-1"
                      rows={2}
                      value={replyInput[c.id] || ''}
                      onChange={(e) =>
                        setReplyInput((p) => ({ ...p, [c.id]: e.target.value }))
                      }
                    />
                    <button
                      onClick={() => handleReplySubmit(c.id)}
                      className="text-xs px-3 py-1 mt-1 rounded border"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      {t('submit')}
                    </button>
                  </div>
                )}

                {/* replies */}
                {showReply[c.id] &&
                  repliesMap[c.id]?.map((r) => {
                    const isReplyAuthor = user && r.uid === user.uid;
                    const replyCreated  =
                      r.createdAt?.toDate
                        ? formatSmartTime(r.createdAt.toDate(), t)
                        : '';

                    return (
                      <div
                        key={r.id}
                        className="ml-4 mt-2 border-l pl-3 text-sm"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <div className="flex justify-between">
                          {/* body */}
                          <div className="flex-1 pr-2">
                            {editingMap[r.id] ? (
                              <>
                                <textarea
                                  className="w-full text-sm border rounded p-1 mb-1"
                                  rows={2}
                                  value={editInputMap[r.id] || ''}
                                  onChange={(e) =>
                                    setEditInputMap((p) => ({ ...p, [r.id]: e.target.value }))
                                  }
                                />
                                <div className="flex gap-2 text-xs">
                                  <button
                                    onClick={() =>
                                      updateComment(
                                        r.id,
                                        (editInputMap[r.id] || '').trim(),
                                        true,
                                        c.id,
                                      )
                                    }
                                    className="px-3 py-1 rounded border"
                                    style={{ borderColor: 'var(--border-color)' }}
                                  >
                                    {t('save')}
                                  </button>
                                  <button
                                    onClick={() =>
                                      setEditingMap((p) => ({ ...p, [r.id]: false }))
                                    }
                                    className="px-3 py-1 rounded border"
                                    style={{ borderColor: 'var(--border-color)' }}
                                  >
                                    {t('cancel')}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold text-sm">
                                  {nicknames[r.uid] || t('anonymous')}{' '}
                                  <span className="text-gray-500 text-xs font-normal">
                                    · {replyCreated}
                                  </span>
                                </p>
                                <p className="whitespace-pre-wrap">{r.content}</p>
                              </>
                            )}
                            {/* 👍 reply like */}
                            <div className="mt-1">
                              <LikeButton
                                path={`recipes/${recipeId}/comments/${c.id}/replies/${r.id}`}
                                uid={user?.uid}
                                likedBy={r.likedBy || []}
                                likes={r.likes || 0}
                                size="xs"
                              />
                            </div>
                          </div>

                          {/* menu */}
                          {isReplyAuthor && (
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setMenuOpen((p) => ({ ...p, [r.id]: !p[r.id] }))
                                }
                              >
                                ⋯
                              </button>
                              {menuOpen[r.id] && (
                                <div className="absolute right-0 mt-1 bg-white dark:bg-zinc-800 border rounded shadow text-sm z-10">
                                  <button
                                    onClick={() => {
                                      setEditingMap((p) => ({ ...p, [r.id]: true }));
                                      setEditInputMap((p) => ({ ...p, [r.id]: r.content }));
                                      setMenuOpen((p) => ({ ...p, [r.id]: false }));
                                    }}
                                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 w-full text-left"
                                  >
                                    {t('edit')}
                                  </button>
                                  <button
                                    onClick={() => deleteReply(c.id, r.id)}
                                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 w-full text-left"
                                  >
                                    {t('delete')}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })
        )}

        {isFetching && ready && (
          <p className="text-center text-sm text-gray-400 mt-2">{t('loading_more')}</p>
        )}
      </div>

      {/* === bottom input bar ========================================== */}
      <div
        className="fixed bottom-0 right-0 w-[400px] p-2"
        style={{ backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border-color)', zIndex: 60 }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('write_comment')}
            className="flex-1 px-3 py-2 rounded border text-sm"
            style={{ borderColor: 'var(--border-color)' }}
          />
          <button
            onClick={handleAddComment}
            className="px-4 text-sm rounded border"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {t('submit')}
          </button>
        </div>
      </div>
    </>
  );
}
