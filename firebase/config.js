import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase 환경 변수 설정 (.env.local에서 불러옴)
const firebaseConfig = {
  apiKey:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // 예: bizarre-food.firebasestorage.app
  messagingSenderId:  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 앱 초기화
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 각 서비스 초기화
export const db = getFirestore(app);
export const auth = getAuth(app);

// ✅ Storage 경로 강제 지정 (문제 해결 핵심)
export const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);
