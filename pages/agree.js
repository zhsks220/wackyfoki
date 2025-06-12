// pages/agree.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function AgreePage() {
  const [agree, setAgree] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    // 비로그인 사용자는 접근 불가
    if (!auth.currentUser) {
      alert('로그인 후 이용해 주세요.');
      router.replace('/login');
    }
  }, []);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return alert('로그인 정보가 없습니다.');
    if (!agree || !privacy) return alert('모든 항목에 동의해주세요.');

    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        agreed: true,
        agreedAt: new Date()
      });

      alert('✅ 동의 완료! 환영합니다.');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="max-w-lg mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-6">약관 동의</h1>

      <div className="space-y-4">
        <label className="block">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mr-2"
          />
          <span>
            <a href="/terms" target="_blank" className="underline text-blue-600">
              이용약관
            </a>
            에 동의합니다.
          </span>
        </label>

        <label className="block">
          <input
            type="checkbox"
            checked={privacy}
            onChange={(e) => setPrivacy(e.target.checked)}
            className="mr-2"
          />
          <span>
            <a href="/privacy" target="_blank" className="underline text-blue-600">
              개인정보처리방침
            </a>
            에 동의합니다.
          </span>
        </label>

        <button
          onClick={handleSubmit}
          className="mt-6 bg-black text-white py-2 px-6 rounded hover:bg-gray-800"
        >
          동의하고 시작하기
        </button>
      </div>
    </div>
  );
}
