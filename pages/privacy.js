import { useTranslation } from 'next-i18next';

export default function PrivacyPage() {
  const { t } = useTranslation('common');

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-6">{t('privacy_title')}</h1>

      <p className="mb-4 whitespace-pre-line">
        {t('privacy_intro')}
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">{t('privacy_section1_title')}</h2>
      <p className="mb-4 whitespace-pre-line">{t('privacy_section1_content')}</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">{t('privacy_section2_title')}</h2>
      <p className="mb-4 whitespace-pre-line">{t('privacy_section2_content')}</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">{t('privacy_section3_title')}</h2>
      <p className="mb-4 whitespace-pre-line">{t('privacy_section3_content')}</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">{t('privacy_section4_title')}</h2>
      <p className="mb-4 whitespace-pre-line">{t('privacy_section4_content')}</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">{t('privacy_section5_title')}</h2>
      <p className="mb-4 whitespace-pre-line">{t('privacy_section5_content')}</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">{t('privacy_section6_title')}</h2>
      <p className="mb-4 whitespace-pre-line">{t('privacy_section6_content')}</p>

      <h2 className="text-xl font-semibold mt-8 mb-2">{t('privacy_section7_title')}</h2>
      <p className="mb-4 whitespace-pre-line">{t('privacy_section7_content')}</p>

      <p className="mt-12 text-sm text-gray-500">{t('privacy_effective_date')}</p>
    </div>
  );
}
