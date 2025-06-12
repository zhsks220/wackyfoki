// pages/reset-password.js
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    setMessage('');
    setError('');

    try {
      // ✅ 이메일로 가입된 계정 존재 여부 확인
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('가입되지 않은 이메일입니다.');
        return;
      }

      // ✅ 가입된 이메일일 경우 비밀번호 재설정 메일 전송
      await sendPasswordResetEmail(auth, email);
      setMessage('비밀번호 재설정 링크를 이메일로 보냈습니다.');
    } catch (err) {
      console.error(err);
      setError('오류가 발생했습니다: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl mb-4">비밀번호 재설정</h1>

      <div className="w-full max-w-sm space-y-3">
        <input
          type="email"
          placeholder="가입된 이메일을 입력하세요"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />

        <button
          onClick={handleResetPassword}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          비밀번호 재설정 메일 보내기
        </button>

        {message && <p className="text-green-600 text-sm">{message}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    </div>
  );
}
