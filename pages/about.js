// pages/about.js
/**
 * 다국어 About 페이지
 * ---------------------------------------------
 * • useTranslation → t('키') 로 모든 문자열 치환
 * • serverSideTranslations 로 번역 JSON preload
 *   (별도 about.json 네임스페이스를 쓰지 않고, 기존 common.json 에
 *   키를 추가해도 무방합니다. 예시는 common 사용)
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

/* 번역 JSON 선로드 (SSG / ISR) */
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
