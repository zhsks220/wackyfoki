'use client';

import { useState, useEffect } from 'react';
import { db, storage, auth } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // ✅ serverTimestamp
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser } from '@/contexts/UserContext';
import { X, UploadCloud } from 'lucide-react';
import StarRating from './StarRating';

const categories = ['식사', '간식', '디저트', '음료', '실험 요리'];

export default function UploadModal({ isOpen, onClose, onUploaded }) { // ✅ onUploaded 추가
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [category, setCategory] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [difficulty, setDifficulty] = useState(0);
  const [taste, setTaste] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  /* ───────── 모달 닫힐 때 입력 초기화 ───────── */
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setYoutubeUrl('');
      setImage(null);
      setPreview('');
      setCategory('');
      setCookTime('');
      setDifficulty(0);
      setTaste(0);
    }
  }, [isOpen]);

  /* ───────── 이미지 미리보기 ───────── */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  /* ───────── 업로드 ───────── */
  const handleSubmit = async () => {
    if (!title || !description) {
      alert('제목과 설명은 필수입니다!');
      return;
    }
    if (
      youtubeUrl.trim() !== '' &&
      !youtubeUrl.includes('youtube.com') &&
      !youtubeUrl.includes('youtu.be')
    ) {
      alert('정상적인 YouTube 링크를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert('사용자 정보를 불러올 수 없습니다.');
        return;
      }
      const { displayName, uid, photoURL } = currentUser;

      /* 이미지 업로드 */
      let imageUrl = '';
      if (image) {
        const imageRef = ref(storage, `images/${image.name}-${Date.now()}`);
        const snap = await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(snap.ref);
      }

      /* Firestore 저장 */
      await addDoc(collection(db, 'recipes'), {
        title,
        description,
        youtubeUrl: youtubeUrl.trim() || '',
        imageUrl,
        category,
        cookTime: cookTime ? Number(cookTime) : '',
        difficulty,
        taste,
        createdAt: serverTimestamp(),           // ✅ 서버 타임스탬프
        authorName: displayName || '익명',
        authorImage: user?.profileImage || photoURL || '',
        uid,
      });

      alert('🎉 업로드 성공!');
      onUploaded?.();    // ✅ 피드 새로고침 콜백
      onClose();
    } catch (err) {
      console.error(err);
      alert('업로드 중 오류 발생.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  /* ───────── UI ───────── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X />
        </button>

        <h2 className="text-lg font-bold mb-4">🍽️ 괴식 레시피 업로드</h2>

        {/* 제목 */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full p-2 mb-3 rounded bg-zinc-100 dark:bg-zinc-800"
        />

        {/* 설명 */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="설명"
          rows={3}
          className="w-full p-2 mb-3 rounded bg-zinc-100 dark:bg-zinc-800"
        />

        {/* YouTube */}
        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="YouTube 링크 (선택)"
          className="w-full p-2 mb-3 rounded bg-zinc-100 dark:bg-zinc-800"
        />

        {/* 카테고리 */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 mb-3 rounded bg-zinc-100 dark:bg-zinc-800"
        >
          <option value="">카테고리 선택</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* 조리 시간 */}
        <input
          type="number"
          value={cookTime}
          onChange={(e) => setCookTime(e.target.value)}
          placeholder="조리 시간 (분)"
          className="w-full p-2 mb-3 rounded bg-zinc-100 dark:bg-zinc-800"
        />

        {/* 난이도 별점 */}
        <div className="mb-3">
          <label className="block mb-1 text-sm text-zinc-500">요리 난이도</label>
          <StarRating rating={difficulty} onRatingChange={setDifficulty} /> {/* ✅ */}
        </div>

        {/* 맛 별점 */}
        <div className="mb-3">
          <label className="block mb-1 text-sm text-zinc-500">맛 평가</label>
          <StarRating rating={taste} onRatingChange={setTaste} /> {/* ✅ */}
        </div>

        {/* 이미지 업로드 */}
        <input type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />
        {preview && (
          <img
            src={preview}
            alt="미리보기"
            className="w-full max-h-60 object-cover rounded mb-3"
          />
        )}

        {/* 업로드 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex justify-center items-center gap-2"
        >
          {loading ? '⏳ 업로드 중...' : (
            <>
              <UploadCloud size={18} /> 업로드
            </>
          )}
        </button>
      </div>
    </div>
  );
}
