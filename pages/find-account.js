// pages/find-account.js
import { useState } from 'react';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function FindAccountPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);

  const handleCheck = async () => {
    if (!email) return alert('이메일을 입력해주세요.');

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        setResult(`✅ 계정이 존재합니다. 사용 가능한 로그인 방법: ${methods.join(', ')}`);
      } else {
        setResult('❌ 해당 이메일로 등록된 계정이 없습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('계정 확인 실패: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl mb-6">계정 찾기</h1>
      <div className="w-full max-w-sm space-y-4">
        <input
          type="email"
          placeholder="가입한 이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <button
          onClick={handleCheck}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          계정 확인하기
        </button>
        {result && <p className="text-center text-sm mt-4">{result}</p>}
      </div>
    </div>
  );
}
