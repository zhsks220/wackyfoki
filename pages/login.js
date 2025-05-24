// pages/login.js
import { auth } from '../firebase/config';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      alert('🎉 로그인 성공!');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('로그인 실패: ' + err.message);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl mb-4">로그인</h1>
      <button
        onClick={handleGoogleLogin}
        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
      >
        Google 계정으로 로그인
      </button>
    </div>
  );
}
