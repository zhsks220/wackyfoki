import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db, storage, auth } from '../firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function UploadPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  // ✅ 로그인 여부 확인
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        alert('로그인 후 이용 가능합니다.');
        setTimeout(() => {
          router.push('/login'); // ✅ 알림 후 확실히 리디렉트
        }, 100);
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      });

      alert('🎉 업로드 성공! 메인 화면으로 이동합니다.');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('업로드 중 오류 발생.');
    }

    setLoading(false);
  };

  if (checkingAuth) return <p style={{ padding: '2rem' }}>로그인 확인 중...</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h1>🍽️ 괴식 레시피 업로드</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>제목:</label><br />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
            style={{ width: '100%', marginBottom: '1rem' }}
          />
        </div>
        <div>
          <label>설명:</label><br />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
            style={{ width: '100%', marginBottom: '1rem' }}
          />
        </div>
        <div>
          <label>YouTube 링크 (선택):</label><br />
          <input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/..."
            style={{ width: '100%', marginBottom: '1rem' }}
          />
        </div>
        <div>
          <label>대표 이미지 (선택):</label><br />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ marginBottom: '1rem' }}
          />
          {preview && (
            <img
              src={preview}
              alt="미리보기"
              style={{ maxWidth: '100%', marginBottom: '1rem' }}
            />
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', padding: '0.5rem' }}
        >
          {loading ? '⏳ 업로드 중...' : '🚀 업로드'}
        </button>
      </form>
    </div>
  );
}
