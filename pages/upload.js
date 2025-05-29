'use client';

import { useState, useEffect } from 'react';
import { db, storage, auth } from '../firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser } from '@/contexts/UserContext';
import { X, UploadCloud } from 'lucide-react';

export default function UploadModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setYoutubeUrl('');
      setImage(null);
      setPreview('');
    }
  }, [isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

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

      let imageUrl = '';
      if (image) {
        const imageRef = ref(storage, `images/${image.name}-${Date.now()}`);
        const snapshot = await uploadBytes(imageRef, image);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      await addDoc(collection(db, 'recipes'), {
        title,
        description,
        youtubeUrl: youtubeUrl.trim() || '',
        imageUrl,
        createdAt: Timestamp.now(),
        authorName: displayName || '익명',
        authorImage: user?.profileImage || photoURL || '',
        uid,
      });

      alert('🎉 업로드 성공!');
      onClose();
    } catch (err) {
      console.error(err);
      alert('업로드 중 오류 발생.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md p-6 relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X />
        </button>

        <h2 className="text-lg font-bold mb-4">🍽️ 새로운 레시피 공유</h2>

        {/* 제목 */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="레시피 제목"
          className="w-full p-2 mb-3 rounded bg-zinc-100 dark:bg-zinc-800"
        />

        {/* 설명 */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="레시피 설명"
          className="w-full p-2 mb-4 rounded bg-zinc-100 dark:bg-zinc-800"
          rows={3}
        />

        {/* YouTube 링크 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-500 mb-1">YouTube 링크 (선택)</label>
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/..."
            className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800"
          />
        </div>

        {/* 이미지 업로드 */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-zinc-500 mb-1">대표 이미지 업로드</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full"
          />
        </div>

        {/* 이미지 미리보기 */}
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
