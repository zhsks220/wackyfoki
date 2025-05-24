import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // "AIzaSyBEBnxZXw8dCnz06jClffTjwepFHp4zGZ0"
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // "bizarre-food.firebaseapp.com"
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // "bizarre-food"
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // "bizarre-food.appspot.com"
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // "665632493484"
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID, // "1:665632493484:web:909fabdb4d1ebb09b57409"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };
