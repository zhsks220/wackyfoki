'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, storage, auth } from '@/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { useUser } from '@/contexts/UserContext';
import Image from 'next/image';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/utils/cropImage';

export default function EditProfile() {
  const { user, refreshUser } = useUser();
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setNickname(data.displayName || '');
        setPreview(data.profileImage || '');
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
      alert('JPG, PNG, WebP 형식의 이미지만 가능합니다.');
      fileInputRef.current.value = null;
      return;
    }

    if (file.size > maxSize) {
      alert('이미지는 2MB 이하로 제한됩니다.');
      fileInputRef.current.value = null;
      return;
    }

    setImage(file);
    setShowCropModal(true);

    // ✅ 동일 이미지 다시 선택 가능하도록 초기화
    fileInputRef.current.value = null;
  };

  const onCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCropDone = async () => {
    const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
    setPreview(URL.createObjectURL(croppedBlob));
    setImage(croppedBlob);
    setShowCropModal(false);
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

      const safeData = {
        ...(nickname && { displayName: nickname }),
        ...(imageUrl && { profileImage: imageUrl }),
      };

      if (Object.keys(safeData).length > 0) {
        await setDoc(doc(db, 'users', user.uid), safeData, { merge: true });
      }

      if (auth.currentUser && safeData.displayName) {
        await updateProfile(auth.currentUser, { displayName: safeData.displayName });
        await auth.currentUser.reload();
        await refreshUser();
      }

      alert('프로필이 저장되었습니다!');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('저장 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p className="p-6">로그인 후 이용해 주세요.</p>;

  return (
    <div className="max-w-xl mx-auto px-6 py-12 text-[var(--foreground)] relative">
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
        <label className="block mb-1">프로필 이미지</label>
        {preview && (
          <Image
            src={preview}
            alt="미리보기"
            width={100}
            height={100}
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

      {/* ✅ 자체 Crop 모달 */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[90vh] overflow-hidden">
            <div className="relative w-full h-[300px] bg-black">
              <Cropper
                image={image && URL.createObjectURL(image)}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="mt-4 flex justify-between items-center">
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-2/3"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCropModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                >
                  취소
                </button>
                <button
                  onClick={handleCropDone}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  자르기 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
