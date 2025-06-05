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
import LikeButton from '@/components/LikeButton'; // ✅ 좋아요 버튼 추가

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
        let authorName = data.authorName || '익명';
        let authorImage = data.authorImage || '/default-avatar.png';

        if (data.uid) {
          const userSnap = await getDoc(doc(db, 'users', data.uid));
          if (userSnap.exists()) {
            const udata = userSnap.data();
            authorName = udata.displayName || authorName;
            authorImage = udata.profileImage || authorImage;
          }
        }

        setRecipe({
          id: docSnap.id,
          ...data,
          authorName,
          authorImage,
        });
      } else {
        setRecipe(null);
      }
    } catch (err) {
      console.error('레시피 로딩 실패:', err);
      setRecipe(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    const snap = await getDocs(collection(db, 'recipes', id, 'comments'));
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setComments(list.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
  }, [id]);

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
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'recipes', recipe.id));
      alert('레시피가 삭제되었습니다.');
      router.push('/');
    } catch (err) {
      console.error('삭제 중 오류:', err);
      alert('삭제 중 오류가 발생했습니다.');
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
        author: user.displayName || user.email,
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

  if (loading) return <p style={{ padding: '2rem' }}>⏳ 로딩 중...</p>;
  if (!recipe) return <p style={{ padding: '2rem' }}>😢 레시피를 찾을 수 없습니다.</p>;

  return (
    <>
      <Head><title>{recipe.title} - WackyFoki</title></Head>
      <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
        {/* 제목 + 수정/삭제 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{recipe.title}</h1>
          {isAuthor && (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>
                ⋯
              </button>
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
                  <button onClick={handleEdit} style={menuStyle}><span>✏</span><span>수정</span></button>
                  <button onClick={handleDelete} style={menuStyle}><span>🗑</span><span>삭제</span></button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 작성자 정보 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
          <img src={recipe.authorImage} alt={recipe.authorName} style={{
            width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', marginRight: 10,
          }} />
          <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{recipe.authorName}</span>
        </div>

        {/* 이미지 */}
        {recipe.imageUrl && (
          <img src={recipe.imageUrl} alt={recipe.title} style={{
            width: '100%', borderRadius: 8, marginBottom: '1rem', backgroundColor: '#222'
          }} />
        )}

        <hr style={{ borderColor: '#444', margin: '1.5rem 0' }} />

        {/* 준비물 */}
        <div style={{ whiteSpace: 'pre-line' }}>
          <strong>준비물:</strong><br />
          {recipe.ingredients || '입력되지 않음'}
        </div>

        <hr style={{ borderColor: '#444', margin: '1.5rem 0' }} />

        {/* 조리 과정 */}
        <div style={{ whiteSpace: 'pre-line' }}>
          <strong>조리과정:</strong><br />
          {recipe.description || '입력되지 않음'}
        </div>

        <hr style={{ borderColor: '#444', margin: '1.5rem 0' }} />

        {/* 조리 시간, 별점 */}
        <p><strong>조리 시간:</strong> {recipe.cookTime || '미입력'}분</p>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#aaa' }}>난이도</span>
            <StarRow value={recipe.difficulty ?? 0} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#aaa' }}>맛</span>
            <StarRow value={recipe.taste ?? 0} />
          </div>
        </div>

        {/* 유튜브 영상 */}
        {recipe.youtubeUrl && (
          <div style={{ marginTop: '1.5rem', position: 'relative', paddingTop: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${extractYouTubeId(recipe.youtubeUrl)}`}
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
        )}

        {/* 좋아요 */}
        <div style={{ marginTop: '1.5rem' }}>
          <LikeButton
            path={`recipes/${recipe.id}`}
            uid={user?.uid}
            likedBy={recipe.likedBy || []}
            likes={recipe.likes || 0}
            onChange={() => fetchRecipe()}
          />
        </div>

        {/* 댓글 */}
        <h3 style={{ marginTop: '2rem' }}>💬 전체 댓글</h3>
        {user ? (
          <div style={{ marginBottom: '1.5rem' }}>
            <textarea value={newComment} onChange={e => setNewComment(e.target.value)}
              rows={3} placeholder="댓글을 입력하세요"
              style={{ width: '100%', padding: '0.5rem', borderRadius: 6 }} />
            <button onClick={handleCommentSubmit} style={{
              marginTop: '0.5rem', backgroundColor: '#222', color: '#fff',
              border: 'none', padding: '0.4rem 0.8rem', borderRadius: 4, cursor: 'pointer'
            }}>등록</button>
          </div>
        ) : <p>로그인 후 댓글을 작성할 수 있습니다.</p>}

        {comments.length > 0 ? comments.map(comment => (
          <div key={comment.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #333' }}>
            <strong>{comment.author}</strong>
            <p style={{ marginTop: '0.25rem' }}>{comment.content}</p>
          </div>
        )) : <p>댓글이 아직 없습니다.</p>}
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
