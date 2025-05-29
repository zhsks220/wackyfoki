import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config'; // db는 getFirestore()에서 가져온 인스턴스

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: userData.profileImage || '', // 🔄 Firestore에서 가져온 사용자 지정 이미지
          });
        } catch (error) {
          console.error('사용자 정보 로드 실패:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await currentUser.reload();
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};

        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: userData.profileImage || '',
        });
      } catch (error) {
        console.error('사용자 정보 새로고침 실패:', error);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
