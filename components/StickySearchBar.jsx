'use client';

import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';

export default function StickySearchBar({ onSearch }) {
  const { t } = useTranslation('common');

  // ✅ 입력값을 별도로 임시 저장
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftCategory, setDraftCategory] = useState('');

  const handleSearch = () => {
    if (typeof onSearch === 'function') {
      onSearch({ keyword: draftKeyword, category: draftCategory });
    }
  };

  return (
    <div className="w-full max-w-[44rem] mx-auto px-4">
      <div
        className="flex items-center w-full rounded-full overflow-hidden transition-colors"
        style={{
          backgroundColor: 'var(--input-bg)',
          border: '1px solid var(--border-color)',
        }}
      >
        {/* 🔽 드롭다운 카테고리 */}
        <select
          value={draftCategory}
          onChange={(e) => setDraftCategory(e.target.value)} // ✅ handleSearch 제거
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
            width: '4rem',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
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
          value={draftKeyword}
          onChange={(e) => setDraftKeyword(e.target.value)}
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
