import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth }       from 'firebase/auth';
import { getFirestore }  from 'firebase/firestore';
import { getStorage }    from 'firebase/storage';

const firebaseConfig = {
  apiKey:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // ① (= …appspot.com)
  messagingSenderId:  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app      = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db      = getFirestore(app);
export const auth    = getAuth(app);

// ② 버킷 URL을 명시적으로 지정(사실 ①만 고쳐도 되지만 안전하게)
export const storage = getStorage(app, `gs://${firebaseConfig.storageBucket}`);
