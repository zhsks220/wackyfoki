'use client';

import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';

export default function StickySearchBar({ onSearch }) {
  const { t } = useTranslation('common');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');

  const handleSearch = () => {
    if (typeof onSearch === 'function') {
      onSearch({ keyword, category });
    }
  };

  return (
    <div
      className="sticky top-4 z-40 w-full px-4 sm:px-0 mb-1"
      style={{ maxWidth: '48rem', margin: '0 auto' }}
    >
      <div
        className="flex items-center rounded-full overflow-hidden transition-colors"
        style={{
          backgroundColor: 'var(--input-bg)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* 🔽 드롭다운 카테고리 */}
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            handleSearch(); // 즉시 필터
          }}
          className="text-sm px-3 py-2 border-r border-[var(--border-color)] focus:outline-none"
          style={{
            backgroundColor: 'var(--input-bg)',
            color: 'var(--foreground)',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
          }}
        >
          <option value="">{t('category_all')}</option>
          <option value="식사">{t('category_meal')}</option>
          <option value="간식">{t('category_snack')}</option>
          <option value="디저트">{t('category_dessert')}</option>
          <option value="음료">{t('category_drink')}</option>
          <option value="실험 요리">{t('category_experiment')}</option>
        </select>

        {/* 🔤 키워드 입력 */}
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={t('search_placeholder')}
          className="flex-1 px-4 py-2 text-sm placeholder-gray-400 dark:placeholder-gray-500"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--foreground)',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
          }}
        />

        {/* 🔍 검색 버튼 */}
        <button
          onClick={handleSearch}
          className="px-4 py-2 hover:brightness-110"
          title={t('search_placeholder')}
        >
          <FiSearch className="text-[var(--foreground)] text-base" />
        </button>
      </div>
    </div>
  );
}
