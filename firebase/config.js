import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase 환경 변수 설정 (.env.local에서 불러옴)
const firebaseConfig = {
  apiKey:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId:  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 앱 초기화
let app;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // 에러 발생 시에도 초기화 시도
  app = initializeApp(firebaseConfig, 'gwesik-web');
}

// 각 서비스 초기화
let db;
try {
  db = getFirestore(app);
  
  // 개발 환경에서 에뮬레이터 사용 설정 (옵션)
  if (process.env.NODE_ENV === 'development' && process.env.FIRESTORE_EMULATOR_HOST) {
    if (!db._settings?.host?.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
  }
} catch (error) {
  console.error('Firestore initialization error:', error);
  // 재시도
  db = getFirestore(app);
}

export { db };
export const auth = getAuth(app);

// ✅ Storage 버킷 주소 직접 지정 (안정성 위해 유지)
export const storage = getStorage(app, 'gs://bizarre-food.firebasestorage.app');
