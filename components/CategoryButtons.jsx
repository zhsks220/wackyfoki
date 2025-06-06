'use client';

import { useContext } from 'react';
import { CategoryContext } from '@/contexts/CategoryContext';
import { useTranslation } from 'next-i18next';

export default function CategoryButtons() {
  const { category, setCategory } = useContext(CategoryContext);
  const { t } = useTranslation('common');

  const categories = [
    { label: t('category_all'), value: '' },
    { label: t('category_meal'), value: '식사' },
    { label: t('category_snack'), value: '간식' },
    { label: t('category_dessert'), value: '디저트' },
    { label: t('category_drink'), value: '음료' },
    { label: t('category_experiment'), value: '실험 요리' },
  ];

  return (
    <div className="overflow-x-auto no-scrollbar px-2 mt-2 mb-1">
      <div className="flex gap-2 w-max">
        {categories.map((cat) => {
          const isSelected = category === cat.value;

          return (
            <button
              key={cat.value || 'all'}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-1 text-sm rounded-full border whitespace-nowrap transition-colors duration-150 ${
                isSelected
                  ? 'bg-[var(--foreground)] text-[var(--background)] font-semibold'
                  : 'bg-transparent border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--foreground)/10]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
