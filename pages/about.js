// pages/about.js
/**
 * 다국어 About 페이지
 * ---------------------------------------------
 * • useTranslation → t('키') 로 모든 문자열 치환
 * • serverSideTranslations 로 번역 JSON preload
 * ---------------------------------------------
 */
import Head from 'next/head';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function AboutPage() {
  const { t } = useTranslation('common');

  return (
    <>
      <Head>
        <title>{t('about_title')}</title>
        <meta name="description" content={t('about_meta')} />
      </Head>

      <div className="max-w-3xl mx-auto px-6 py-12 text-[var(--foreground)]">
        <h1 className="text-3xl font-bold mb-6">🤪 {t('about_heading')}</h1>

        <p className="mb-4 text-lg leading-relaxed">{t('about_p1')}</p>
        <p className="mb-4 text-lg leading-relaxed">{t('about_p2')}</p>
        <p className="mb-4 text-lg leading-relaxed">{t('about_p3')}</p>
        <p className="mb-4 text-lg leading-relaxed">{t('about_p4')}</p>
        <p className="mb-4 text-lg leading-relaxed">{t('about_p5')}</p>
        <p className="mb-4 text-lg leading-relaxed">{t('about_p6')}</p>
        <p className="mb-4 text-lg leading-relaxed">{t('about_p7')}</p>
        <p className="mb-4 text-lg leading-relaxed">{t('about_p8')}</p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">📌 {t('about_ops_heading')}</h2>
        <p className="text-base leading-relaxed">
          {t('about_ops_body')}{' '}
          <a
            href="mailto:contact@wackyfoki.com"
            className="underline text-blue-500"
          >
            contact@wackyfoki.com
          </a>
        </p>

        <p className="text-sm text-gray-500 mt-8">{t('about_notice')}</p>
      </div>
    </>
  );
}

/* 번역 JSON preload (SSG / ISR) */
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
