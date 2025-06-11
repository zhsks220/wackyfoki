// pages/contact.js
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ContactPage() {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        {/* ✅ 브라우저 탭 제목 */}
        <title>{t('contact_title')}</title>
        {/* ✅ 메타 설명 (SEO) */}
        <meta name="description" content={t('contact_meta')} />
      </Head>

      <div className="max-w-3xl mx-auto px-6 py-12 text-[var(--foreground)]">
        <h1 className="text-3xl font-bold mb-6">📬 {t('contact_heading')}</h1>
        <p className="mb-4 text-lg leading-relaxed">{t('contact_p1')}</p>

        <div className="bg-[var(--card-bg)] text-[var(--card-text)] border border-[var(--border-color)] rounded-lg p-6 mt-6">
          <p className="text-lg font-semibold">📧 {t('contact_email_label')}</p>
          <p className="mt-1 select-all">
            <a
              href="mailto:contact@wackyfoki.com"
              className="underline text-blue-500"
            >
              contact@wackyfoki.com
            </a>
          </p>
        </div>

        <h2 className="text-2xl font-semibold mt-10 mb-4">👤 {t('contact_owner_heading')}</h2>
        <p className="text-base leading-relaxed">{t('contact_owner_body')}</p>

        <h2 className="text-2xl font-semibold mt-10 mb-2">📌 {t('contact_response_heading')}</h2>
        <p className="text-base leading-relaxed">{t('contact_response_guide')}</p>

        <h2 className="text-2xl font-semibold mt-10 mb-2">🔒 {t('contact_privacy_heading')}</h2>
        <p className="text-base leading-relaxed">{t('contact_privacy_notice')}</p>

        <h2 className="text-2xl font-semibold mt-10 mb-2">📂 {t('contact_inquiry_heading')}</h2>
        <ul className="list-disc pl-6 text-base leading-relaxed">
          <li>{t('contact_inquiry_general')}</li>
          <li>{t('contact_inquiry_ads')}</li>
          <li>{t('contact_inquiry_report')}</li>
        </ul>

        <p className="text-sm text-gray-500 mt-8">{t('contact_notice')}</p>
      </div>
    </>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
