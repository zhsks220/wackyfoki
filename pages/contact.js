// pages/contact.js
/**
 * 다국어 Contact 페이지 (common 네임스페이스 재사용)
 * --------------------------------------------------
 * ① 모든 문자열을 t('…') 로 치환
 * ② getStaticProps 에서 common.json preload
 * --------------------------------------------------
 */
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ContactPage() {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>{t('contact_title')}</title>
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

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          👤 {t('contact_owner_heading')}
        </h2>
        <p className="text-base leading-relaxed">{t('contact_owner_body')}</p>

        <p className="text-sm text-gray-500 mt-8">{t('contact_notice')}</p>
      </div>
    </>
  );
}

/* SSG/ISR 번역 preload */
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common']))
    }
  };
}
