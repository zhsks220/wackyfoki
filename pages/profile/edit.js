'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, storage, auth } from '@/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { useUser } from '@/contexts/UserContext';
import Image from 'next/image';

export default function EditProfile() {
  const { user, refreshUser } = useUser();
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const userRef = doc(db, 'users', user.email);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setNickname(data.displayName || '');
        setPreview(data.profileImageUrl || '');
      }
    };

    fetchData();
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 2 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      alert('JPG, PNG, WebP 형식의 이미지만 사용할 수 있습니다.');
      return;
    }

    if (file.size > maxSize) {
      alert('이미지 크기는 2MB 이하로 업로드해 주세요.');
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    let imageUrl = preview;

    try {
      if (image) {
        const storageRef = ref(storage, `${user.uid}-${Date.now()}`);
        await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(storageRef);
      }

      // ✅ 안전하게 필드 구성
      const safeData = {};
      if (nickname !== undefined && nickname.trim() !== '') {
        safeData.displayName = nickname.trim();
      }
      if (imageUrl !== undefined && imageUrl !== '') {
        safeData.profileImageUrl = imageUrl;
      }

      if (Object.keys(safeData).length > 0) {
        await setDoc(doc(db, 'users', user.email), safeData, { merge: true });
      }

      // ✅ Firebase Auth에 닉네임 저장
      if (auth.currentUser && safeData.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: safeData.displayName,
        });

        await auth.currentUser.reload();
        await refreshUser();
      }

      alert('프로필이 저장되었습니다!');
      router.push('/');
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <p className="p-6">로그인 후 이용해 주세요.</p>;
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12 text-[var(--foreground)]">
      <h1 className="text-2xl font-bold mb-6">👤 프로필 설정</h1>

      <div className="mb-4">
        <label className="block mb-1">닉네임</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full border rounded px-3 py-2 bg-white text-black"
        />
      </div>

      <div className="mb-6">
        <label className="block mb-1">
          프로필 이미지{' '}
          <span className="text-sm text-gray-500">
            (정사각형 320x320px 이상, JPG/PNG/WebP, 2MB 이하)
          </span>
        </label>

        {preview && (
          preview.startsWith('blob:')
            ? <img src={preview} alt="미리보기" className="w-24 h-24 rounded-full object-cover mb-2" />
            : <Image
                src={preview}
                alt="프로필 이미지"
                width={320}
                height={320}
                className="rounded-full object-cover mb-2"
              />
        )}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          ref={fileInputRef}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black rounded"
        >
          이미지 선택하기
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800"
      >
        {loading ? '저장 중...' : '저장하기'}
      </button>
    </div>
  );
}
