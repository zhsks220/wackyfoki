import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// Firebase 환경 변수 설정 (.env.local에서 불러옴)
const firebaseConfig = {
  apiKey:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ✅ 주석처리: .env.local에 의존하지 않음
  // storageBucket:    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 앱 초기화
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 각 서비스 초기화
export const db = getFirestore(app);
export const auth = getAuth(app);

// ✅ Storage 버킷 경로 강제 지정 (문제 해결 핵심)
export const storage = getStorage(app, 'gs://bizarre-food.firebasestorage.app');

// ✅ 디버깅용 확인 코드 (필요 시 삭제 가능)
const testRef = ref(storage, 'test.webp');
console.log('🧪 Storage Ref:', testRef.toString());

getDownloadURL(testRef)
  .then((url) => console.log('✅ Download URL:', url))
  .catch((e) => console.error('❌ Error fetching URL:', e));
