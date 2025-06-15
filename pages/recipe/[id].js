// pages/recipe/[id].js
'use client';

import { useRouter } from 'next/router';
import { useEffect, useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import {
  doc, getDoc, deleteDoc,
  collection, getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useUser } from '@/contexts/UserContext';
import {
  FaStar, FaStarHalfAlt, FaRegStar,
  FaRegCommentDots
} from 'react-icons/fa';
import LikeButton     from '@/components/LikeButton';
import CommentDrawer  from '@/components/CommentDrawer';
import { useTranslation } from 'next-i18next';

/* ------------------------------------------------------------------ */
/* 유틸 컴포넌트들                                                     */
/* ------------------------------------------------------------------ */
function StarRow({ value = 0 }) {
  const v = Number(value) || 0;
  return (
    <div style={{ display: 'flex', color: '#facc15', fontSize: '0.9rem' }}>
      {Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        const full = n <= v;
        const half = !full && n - 0.5 === v;
        return (
          <span key={i} style={{ marginRight: 2 }}>
            {full ? <FaStar /> : half ? <FaStarHalfAlt /> : <FaRegStar />}
          </span>
        );
      })}
    </div>
  );
}

function extractYouTubeId(url = '') {
  const m = url.match(/(?:youtube\.com.*[?&]v=|youtu\.be\/|shorts\/)([^&?/]+)/);
  return m?.[1] || null;
}

/* ------------------------------------------------------------------ */
/* 상세 페이지                                                         */
/* ------------------------------------------------------------------ */
export default function RecipeDetailPage() {
  const router           = useRouter();
  const { id }           = router.query;
  const { user }         = useUser();
  const { t }            = useTranslation('common');

  /* ---------------- state ---------------- */
  const [recipe,  setRecipe]   = useState(null);
  const [loading, setLoading]  = useState(true);

  const [previewComments, setPreview] = useState([]);  // 미리보기 3개
  const [commentTotal,    setTotal]   = useState(0);   // 총 개수

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDrawer,   setShowDrawer]   = useState(false);
  const dropdownRef = useRef(null);

  /* ---------------- firestore ---------------- */
  const fetchRecipe = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'recipes', id));
      if (!snap.exists()) { setRecipe(null); return; }

      const data = snap.data();
      let authorName  = data.authorName  || t('anonymous');
      let authorImage = data.authorImage || '/default-avatar.png';

      if (data.uid) {
        const uSnap = await getDoc(doc(db, 'users', data.uid));
        if (uSnap.exists()) {
          const u = uSnap.data();
          authorName  = u.displayName  || authorName;
          authorImage = u.profileImage || authorImage;
        }
      }

      setRecipe({ id: snap.id, ...data, authorName, authorImage });
    } finally { setLoading(false); }
  }, [id, t]);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    const snap = await getDocs(collection(db, 'recipes', id, 'comments'));

    const list = await Promise.all(
      snap.docs.map(async d => {
        const data = d.data();
        let displayName = t('anonymous');
        if (data.uid) {
          const uSnap = await getDoc(doc(db, 'users', data.uid));
          if (uSnap.exists()) displayName = uSnap.data().displayName || displayName;
        }
        return { id: d.id, ...data, displayName };
      })
    );

    /* 좋아요 desc → 최신순 */
    const sorted = list.sort(
      (a, b) => (b.likes - a.likes) || (b.createdAt?.seconds - a.createdAt?.seconds)
    );

    setPreview(sorted.slice(0, 3));
    setTotal(sorted.length);
  }, [id, t]);

  /* ---------------- effects ---------------- */
  useEffect(() => { fetchRecipe(); fetchComments(); }, [fetchRecipe, fetchComments]);

  /* dropdown 외부 클릭 닫기 */
  useEffect(() => {
    const out = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', out);
    return () => document.removeEventListener('mousedown', out);
  }, []);

  /* ---------------- handlers ---------------- */
  const handleDelete = async () => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await deleteDoc(doc(db, 'recipes', recipe.id));
      alert(t('alert_deleted'));
      router.push('/');
    } catch { alert(t('alert_delete_error')); }
  };

  const isAuthor  = user?.uid === recipe?.uid;
  const youtubeId = extractYouTubeId(recipe?.youtubeUrl);

  /* ---------------- render ---------------- */
  if (loading) return <p style={{ padding: '2rem' }}>{t('loading')}</p>;
  if (!recipe)   return <p style={{ padding: '2rem' }}>{t('not_found')}</p>;

  return (
    <>
      <Head><title>{recipe.title} - WackyFoki</title></Head>

      <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>

        {/* ⋯ 드롭다운 -------------------------------------------------- */}
        {isAuthor && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(p => !p)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--card-text)'
                }}
              >⋯</button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '2rem',
                  right: 0,
                  zIndex: 9,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--card-text)',
                  borderRadius: 6,
                  overflow: 'hidden'
                }}>
                  <button
                    onClick={() => router.push(`/edit/${recipe.id}`)}
                    style={menuStyle}
                  >✏ {t('edit')}</button>
                  <button
                    onClick={handleDelete}
                    style={menuStyle}
                  >🗑 {t('delete')}</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- 타이틀 ---------------- */}
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{recipe.title}</h1>

        {/* ---------------- 본문 ---------------- */}
        <hr style={{ borderColor: 'var(--border-color)', margin: '1.5rem 0' }} />
        <p><strong>{t('prepare_items')}:</strong><br />{recipe.ingredients || t('not_entered')}</p>
        <hr style={{ borderColor: 'var(--border-color)', margin: '1.5rem 0' }} />
        <p>🕒 {recipe.cookTime ? t('cook_time_full', { count: recipe.cookTime }) : t('not_entered')}</p>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginTop: '1rem' }}>
          <span style={{ color: 'var(--border-color)' }}>{t('difficulty')}</span><StarRow value={recipe.difficulty ?? 0} />
          <span style={{ color: 'var(--border-color)' }}>{t('taste')}</span><StarRow value={recipe.taste ?? 0} />
        </div>

        <hr style={{ borderColor: 'var(--border-color)', margin: '1.5rem 0' }} />
        <p style={{ whiteSpace: 'pre-wrap' }}>
          <strong>{t('description')}:</strong><br />
          {recipe.description || t('not_entered')}
        </p>

        {/* 이미지 & YouTube */}
        {Array.isArray(recipe.imageUrls) && recipe.imageUrls.map((url, i) => (
          <div key={i} style={{ margin: '1rem 0' }}>
            <img src={url} alt={`step-${i}`} style={{ width: '100%', borderRadius: 8 }} />
            {recipe.descriptions?.[i] && (
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{recipe.descriptions[i]}</p>
            )}
          </div>
        ))}

        {youtubeId && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ position: 'relative', paddingTop: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                allowFullScreen
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '100%', height: '100%', border: 'none',
                  borderRadius: 8
                }}
              />
            </div>
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem' }}>
              {t('source')}: <a
                href={recipe.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#4fafff' }}
              >{t('youtube_link')}</a>
            </p>
          </div>
        )}

        {/* ---------------- 좋아요 + 말풍선 ---------------- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <LikeButton
            path={`recipes/${recipe.id}`}
            uid={user?.uid}
            likedBy={recipe.likedBy || []}
            likes={recipe.likes || 0}
            onChange={(likedBy, likes) => setRecipe(p => ({ ...p, likedBy, likes }))}
          />

          <button
            onClick={() => setShowDrawer(d => !d)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--card-text)',
              transform: 'translateY(1px)'
            }}
          >
            <FaRegCommentDots style={{ fontSize: '1.25rem' }} />
            <span style={{ fontSize: '0.9rem' }}>{commentTotal}</span>
          </button>
        </div>

        {/* ---------------- 댓글 미리보기 ---------------- */}
        <h3 style={{ marginTop: '2rem' }}>💬 {t('see_all_comments')}</h3>

        {commentTotal === 0 ? (
          <p>{t('no_comments')}</p>
        ) : (
          <>
            {previewComments.map(c => (
              <div
                key={c.id}
                style={{
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border-color)'
                }}
              >
                <strong>{c.displayName}</strong>
                <p style={{ marginTop: '0.25rem' }}>{c.content}</p>
                <LikeButton
                  path={`recipes/${recipe.id}/comments/${c.id}`}
                  uid={user?.uid}
                  likedBy={c.likedBy || []}
                  likes={c.likes || 0}
                  onChange={(likedBy, likes) =>
                    setPreview(prev => prev.map(pc =>
                      pc.id === c.id ? { ...pc, likedBy, likes } : pc
                    ))
                  }
                  size="sm"
                />
              </div>
            ))}

            {/* 그라데이션 + 버튼 */}
            {commentTotal > 3 && (
              <div style={{ position: 'relative', marginTop: '-1rem' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 0, right: 0, bottom: 0,
                    height: '4rem',
                    background: `linear-gradient(to top, var(--recipe-card-bg), transparent)`,
                    pointerEvents: 'none',
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8
                  }}
                />
                <div style={{
                  textAlign: 'center',
                  marginTop: '2rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <button
                    onClick={() => setShowDrawer(true)}
                    style={{
                      padding: '0.3rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 999,
                      color: 'var(--card-text)',
                      cursor: 'pointer'
                    }}
                  >
                    {t('see_all_comments')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ---------------- Drawer ---------------- */}
      {recipe && (
        <CommentDrawer
          open={showDrawer}
          onClose={() => setShowDrawer(false)}
          recipeId={recipe.id}
          user={user}
        />
      )}
    </>
  );
}

/* 드롭다운 버튼 공통 스타일 */
const menuStyle = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '0.5rem 1rem',
  background: 'none',
  color: 'var(--card-text)',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '0.95rem'
};
