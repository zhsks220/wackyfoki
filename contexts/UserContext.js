import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);

      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();

            if (userData.agreed === true) {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: userData.displayName || firebaseUser.displayName || '',
                photoURL: userData.profileImage || '', // 🔥 여기서만 이미지 사용
                agreed: true,
                emailVerified: firebaseUser.emailVerified || false,
              });
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('사용자 정보 로드 실패:', error);
          setUser(null);
        }
      } else {
        setUser(null); // 로그아웃 상태 반영
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      await currentUser.reload();
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        if (userData.agreed === true) {
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: userData.displayName || currentUser.displayName || '',
            photoURL: userData.profileImage || '',
            agreed: true,
            emailVerified: currentUser.emailVerified || false,
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('사용자 정보 새로고침 실패:', error);
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null); // 🔥 로그아웃 시 모든 정보 제거
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoading, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
