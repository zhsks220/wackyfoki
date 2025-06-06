'use client';

import { createContext, useContext, useState } from 'react';

// 카테고리 컨텍스트 생성
export const CategoryContext = createContext(null);

// 카테고리 프로바이더
export function CategoryProvider({ children }) {
  const [category, setCategory] = useState(''); // '' = 전체

  return (
    <CategoryContext.Provider value={{ category, setCategory }}>
      {children}
    </CategoryContext.Provider>
  );
}

// 커스텀 훅: 컨텍스트 내부가 아닐 경우 에러
export function useCategory() {
  const context = useContext(CategoryContext);
  if (context === null) {
    throw new Error('useCategory는 반드시 <CategoryProvider> 내부에서 사용해야 합니다.');
  }
  return context;
}
