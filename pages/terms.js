'use client';

import { useTranslation } from 'next-i18next';

export default function TermsPage() {
  const { t } = useTranslation('common');

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-6">{t('terms_title')}</h1>

      <p className="mb-4 whitespace-pre-line">{t('terms_intro')}</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">{t('terms_1_title')}</h2>
      <p className="mb-4 whitespace-pre-line">{t('terms_1_content')}</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">{t('terms_2_title')}</h2>
      <p className="mb-4 whitespace-pre-line">{t('terms_2_content')}</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">{t('terms_3_title')}</h2>
      <p className="mb-4 whitespace-pre-line">{t('terms_3_content')}</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">{t('terms_4_title')}</h2>
      <p className="mb-4 whitespace-pre-line">{t('terms_4_content')}</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">{t('terms_5_title')}</h2>
      <p className="mb-4 whitespace-pre-line">{t('terms_5_content')}</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">{t('terms_6_title')}</h2>
      <p className="mb-4 whitespace-pre-line">{t('terms_6_content')}</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">{t('terms_7_title')}</h2>
      <p className="mb-4 whitespace-pre-line">{t('terms_7_content')}</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">{t('terms_8_title')}</h2>
      <p className="mb-4 whitespace-pre-line">{t('terms_8_content')}</p>

      <p className="mt-12 text-sm text-gray-500">{t('terms_effective_date')}</p>
    </div>
  );
}
