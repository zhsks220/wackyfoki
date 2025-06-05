'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../../firebase/config';
import { useUser } from '@/contexts/UserContext';
import StarRating from '@/components/StarRating';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function EditRecipePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [difficulty, setDifficulty] = useState(0);
  const [taste, setTaste] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const snap = await getDoc(doc(db, 'recipes', id));
      if (snap.exists()) {
        const data = snap.data();
        if (data.uid !== user?.uid) {
          alert('본인의 레시피만 수정할 수 있습니다.');
          router.push('/');
          return;
        }

        setTitle(data.title || '');
        setDescription(data.description || '');
        setIngredients(data.ingredients || '');
        setCookTime(data.cookTime || '');
        setDifficulty(data.difficulty || 0);
        setTaste(data.taste || 0);
        setYoutubeUrl(data.youtubeUrl || '');
        setImageUrl(data.imageUrl || '');
        setPreview(data.imageUrl || '');
      }
      setLoading(false);
    };

    fetchData();
  }, [id, user, router]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async () => {
    if (!title.trim() || !description.trim()) {
      alert('제목과 설명은 필수입니다.');
      return;
    }

    let finalImageUrl = imageUrl;

    if (newImage) {
      const imageRef = ref(storage, `images/${newImage.name}-${Date.now()}`);
      const snap = await uploadBytes(imageRef, newImage);
      finalImageUrl = await getDownloadURL(snap.ref);
    }

    try {
      await updateDoc(doc(db, 'recipes', id), {
        title,
        description,
        ingredients,
        cookTime: Number(cookTime),
        difficulty,
        taste,
        youtubeUrl: youtubeUrl.trim(),
        imageUrl: finalImageUrl,
        updatedAt: new Date(),
      });
      alert('레시피가 수정되었습니다.');
      router.push(`/recipe/${id}`);
    } catch (err) {
      console.error('수정 실패:', err);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <p style={{ padding: '2rem' }}>⏳ 로딩 중...</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>✏️ 레시피 수정</h1>

      <label>제목</label>
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={inputStyle}
      />

      <label>준비물</label>
      <textarea
        value={ingredients}
        onChange={e => setIngredients(e.target.value)}
        rows={3}
        style={inputStyle}
      />

      <label>조리 과정</label>
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={6}
        style={inputStyle}
      />

      <label>조리 시간 (분)</label>
      <input
        type="number"
        value={cookTime}
        onChange={(e) => setCookTime(e.target.value)}
        style={inputStyle}
      />

      <label>YouTube 링크</label>
      <input
        type="text"
        value={youtubeUrl}
        onChange={(e) => setYoutubeUrl(e.target.value)}
        placeholder="https://youtu.be/abc123"
        style={inputStyle}
      />

      <label style={{ display: 'block', marginBottom: 8 }}>이미지 수정</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{
          marginBottom: '1.5rem',
          display: 'block',
          width: '100%'
          }}
      />
      {preview && (
        <img
          src={preview}
          alt="미리보기"
          style={{ width: '100%', maxHeight: 300, objectFit: 'cover', marginBottom: '1.5rem', borderRadius: 8 }}
        />
      )}

      <label style={{ display: 'block', marginBottom: 8 }}>요리 난이도</label>
      <StarRating rating={difficulty} onRatingChange={setDifficulty} />
      <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1.5rem' }}>
        난이도: {difficulty.toFixed(1)} / 5
      </p>

      <label>맛 평가</label>
      <StarRating rating={taste} onRatingChange={setTaste} />
      <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '2rem' }}>
        맛 점수: {taste.toFixed(1)} / 5
      </p>

      <button onClick={handleUpdate} style={buttonStyle}>저장</button>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.5rem',
  fontSize: '1rem',
  marginBottom: '1.5rem',
};

const buttonStyle = {
  backgroundColor: '#3399ff',
  color: 'white',
  padding: '0.75rem 1.5rem',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: '1rem',
};
