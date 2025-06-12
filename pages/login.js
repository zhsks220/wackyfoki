'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation('common');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // 로그인 상태일 경우 처리
    });
    return () => unsubscribe();
  }, []);

  const checkAgreementAndRedirect = async (user) => {
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists() && docSnap.data().agreed) {
      alert(t('login_success'));
      router.push('/');
    } else {
      router.push('/agree');
    }
  };

  const handleEmailAuth = async () => {
    try {
      let result;
      if (isRegister) {
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      const user = result.user;
      await checkAgreementAndRedirect(user);
    } catch (err) {
      console.error(err);
      alert(t('email_error') + ': ' + err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await checkAgreementAndRedirect(user);
    } catch (err) {
      console.error(err);
      alert(t('google_login_error') + ': ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl mb-6">{t('login')}</h1>

      <div className="w-full max-w-sm space-y-3">
        <input
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />

        <button
          onClick={handleEmailAuth}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {isRegister ? t('register') : t('login_with_email')}
        </button>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="text-sm underline text-gray-600"
        >
          {isRegister ? t('already_have_account') : t('no_account_yet')}
        </button>

        <div className="flex justify-end text-sm text-blue-600 mt-2">
          <button onClick={() => router.push('/reset-password')} className="hover:underline">
            {t('forgot_password')}
          </button>
        </div>

        <hr className="my-4" />

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
        >
          {t('login_with_google')}
        </button>
      </div>
    </div>
  );
}

// ✅ 다국어 props 세팅
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
