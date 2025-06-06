'use client';

import { createContext, useContext, useState } from 'react';

// 🔍 검색 전용 컨텍스트 (검색어 + 드롭다운용 카테고리 포함)
export const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [keyword, setKeyword] = useState(''); // 🔤 입력된 검색어
  const [searchCategory, setSearchCategory] = useState(''); // 🔽 select에서 선택한 카테고리

  return (
    <SearchContext.Provider value={{
      keyword,
      setKeyword,
      searchCategory,
      setSearchCategory,
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === null) {
    throw new Error('useSearch는 반드시 <SearchProvider> 내부에서 사용해야 합니다.');
  }
  return context;
}
