'use client';

import { useRouter } from 'next/router';
import { useEffect, useState, useCallback, useRef } from 'react';
import Head from 'next/head';
import {
  doc, getDoc, deleteDoc,
  collection, getDocs, addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useUser } from '@/contexts/UserContext';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import LikeButton from '@/components/LikeButton';
import { useTranslation } from 'next-i18next';

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

function extractYouTubeId(url) {
  try {
    const regExp = /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&?/]+)/;
    const match = url.match(regExp);
    return match && match[1] ? match[1] : null;
  } catch {
    return null;
  }
}

export default function RecipeDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const { t } = useTranslation('common');

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchRecipe = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'recipes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        let authorName = data.authorName || t('anonymous');
        let authorImage = data.authorImage || '/default-avatar.png';
        if (data.uid) {
          const userSnap = await getDoc(doc(db, 'users', data.uid));
          if (userSnap.exists()) {
            const udata = userSnap.data();
            authorName = udata.displayName || authorName;
            authorImage = udata.profileImage || authorImage;
          }
        }
        setRecipe({ id: docSnap.id, ...data, authorName, authorImage });
      } else {
        setRecipe(null);
      }
    } catch (err) {
      console.error(t('load_error'), err);
      setRecipe(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  // ✅ 댓글 닉네임 실시간 반영
  const fetchComments = useCallback(async () => {
    if (!id) return;
    const snap = await getDocs(collection(db, 'recipes', id, 'comments'));
    const list = await Promise.all(
      snap.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let displayName = t('anonymous');
        if (data.uid) {
          const userSnap = await getDoc(doc(db, 'users', data.uid));
          if (userSnap.exists()) {
            const udata = userSnap.data();
            displayName = udata.displayName || t('anonymous');
          }
        }
        return { id: docSnap.id, ...data, displayName };
      })
    );
    setComments(list.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
  }, [id, t]);

  useEffect(() => {
    fetchRecipe();
    fetchComments();
  }, [fetchRecipe, fetchComments]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (!window.confirm(t('confirm_delete'))) return;
    try {
      await deleteDoc(doc(db, 'recipes', recipe.id));
      alert(t('alert_deleted'));
      router.push('/');
    } catch (err) {
      console.error(t('delete_error'), err);
      alert(t('alert_delete_error'));
    }
  };

  const handleEdit = () => {
    router.push(`/edit/${recipe.id}`);
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      const commentRef = collection(db, 'recipes', id, 'comments');
      await addDoc(commentRef, {
        uid: user.uid,
        content: newComment.trim(),
        likes: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
      });
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('댓글 작성 오류:', err);
    }
  };

  const isAuthor = user?.uid === recipe?.uid;

  if (loading) return <p style={{ padding: '2rem' }}>⏳ {t('loading')}</p>;
  if (!recipe) return <p style={{ padding: '2rem' }}>😢 {t('not_found')}</p>;

  const youtubeId = extractYouTubeId(recipe.youtubeUrl);

  return (
    <>
      <Head><title>{recipe.title} - WackyFoki</title></Head>
      <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{recipe.title}</h1>
          {isAuthor && (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>⋯</button>
              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '2rem',
                  right: 0,
                  backgroundColor: '#222',
                  border: '1px solid #444',
                  borderRadius: 6,
                  overflow: 'hidden',
                  zIndex: 9999
                }}>
                  <button onClick={handleEdit} style={menuStyle}><span>✏</span><span>{t('edit')}</span></button>
                  <button onClick={handleDelete} style={menuStyle}><span>🗑</span><span>{t('delete')}</span></button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
          <img src={recipe.authorImage} alt={recipe.authorName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', marginRight: 10 }} />
          <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{recipe.authorName}</span>
        </div>

        {recipe.imageUrl && (
          <img src={recipe.imageUrl} alt={recipe.title} style={{ width: '100%', borderRadius: 8, marginBottom: '1rem', backgroundColor: '#222' }} />
        )}

        <hr style={{ borderColor: '#444', margin: '1.5rem 0' }} />

        <div style={{ whiteSpace: 'pre-line' }}>
          <strong>{t('prepare_items')}:</strong><br />
          {recipe.ingredients || t('not_entered')}
        </div>

        <hr style={{ borderColor: '#444', margin: '1.5rem 0' }} />

        <div style={{ whiteSpace: 'pre-line' }}>
          <strong>{t('description')}:</strong><br />
          {recipe.description || t('not_entered')}
        </div>

        <hr style={{ borderColor: '#444', margin: '1.5rem 0' }} />

        {recipe.cookTime ? (
          <p>🕒 {t('cook_time_full', { count: recipe.cookTime })}</p>
        ) : (
          <p>🕒 {t('not_entered')}</p>
        )}

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#aaa' }}>{t('difficulty')}</span>
            <StarRow value={recipe.difficulty ?? 0} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#aaa' }}>{t('taste')}</span>
            <StarRow value={recipe.taste ?? 0} />
          </div>
        </div>

        {youtubeId && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ position: 'relative', paddingTop: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="YouTube Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 8,
                }}
              />
            </div>
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem' }}>
              {t('source')}:{' '}
              <a href={recipe.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4fafff', textDecoration: 'underline' }}>
                {t('youtube_link')}
              </a>
            </p>
          </div>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <LikeButton
            path={`recipes/${recipe.id}`}
            uid={user?.uid}
            likedBy={recipe.likedBy || []}
            likes={recipe.likes || 0}
            onChange={() => fetchRecipe()}
          />
        </div>

        <h3 style={{ marginTop: '2rem' }}>💬 {t('see_all_comments')}</h3>
        {user ? (
          <div style={{ marginBottom: '1.5rem' }}>
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)} rows={3} placeholder={t('comment_placeholder')} style={{ width: '100%', padding: '0.5rem', borderRadius: 6 }} />
            <button onClick={handleCommentSubmit} style={{
              marginTop: '0.5rem', backgroundColor: '#222', color: '#fff',
              border: 'none', padding: '0.4rem 0.8rem', borderRadius: 4, cursor: 'pointer'
            }}>{t('submit')}</button>
          </div>
        ) : <p>{t('login_required_comment')}</p>}

        {comments.length > 0 ? comments.map(comment => (
          <div key={comment.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #333' }}>
            <strong>{comment.displayName}</strong>
            <p style={{ marginTop: '0.25rem' }}>{comment.content}</p>
          </div>
        )) : <p>{t('no_comments')}</p>}
      </div>
    </>
  );
}

const menuStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  width: '100%',
  padding: '0.5rem 1rem',
  background: 'none',
  color: 'white',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '0.95rem',
  gap: '0.5rem',
};
