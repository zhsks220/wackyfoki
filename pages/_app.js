/* pages/_app.js
   ──────────────────────────────────────────────────────────────
   • 🌐 Language 메뉴: “한국어 / English / 日本語 / 中文” 라벨 표시
   • 언어를 클릭하면 router.push → window.location.reload()
     → 즉시 새 JSON이 로드되어 번역이 바로 반영
   • 나머지 구조는 이전 버전과 동일
   ────────────────────────────────────────────────────────────── */
import '@/styles/globals.css';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { appWithTranslation, useTranslation } from 'next-i18next';
import nextI18NextConfig from '../next-i18next.config';

import { UserProvider, useUser } from '@/contexts/UserContext';

/* 🌐 지원 언어: 코드 + 라벨 */
const LOCALES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];

function AppLayout({ Component, pageProps }) {
  const { t }  = useTranslation('common');
  const router = useRouter();

  const [darkMode,     setDarkMode]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [langOpen,     setLangOpen]     = useState(false);

  const dropdownRef = useRef(null);
  const { user, logout } = useUser();

  /* 시스템 다크모드 기본값 */
  useEffect(() => {
    const prefers = matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefers);
    document.documentElement.classList.toggle('dark', prefers);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  /* 드롭다운 외부 클릭 닫기 */
  useEffect(() => {
    const handle = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSettingsOpen(false);
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  /* 현재 경로 유지하며 언어 전환 + 강제 새로고침 */
  const changeLocale = (loc) => {
    router
      .push(router.asPath, undefined, { locale: loc, scroll: false })
      .then(() => window.location.reload());
  };

  return (
    <>
      <Head>
        <title>WackyFoki</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/포키.png" />
      </Head>

      <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors">
        {/* ───────── 헤더 ───────── */}
        <header className="w-full px-4 sm:px-6 pt-4 sm:pt-6 pb-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/포키.png" alt="logo" className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="font-bold text-base sm:text-lg">
              WACKY <span className="font-light">FOKI</span>
            </span>
          </Link>

          {/* 프로필 드롭다운 */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(p => !p)}
              className="w-10 h-10 rounded-full overflow-hidden border bg-white"
            >
              <img
                src={user?.photoURL || '/default-avatar.png'}
                alt="profile"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/default-avatar.png'; }}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded shadow p-4 z-50 bg-[var(--header-bg)]">
                {user && <div className="font-semibold mb-2">{user.displayName}</div>}

                <Link href="/mypage"><div className="py-2 hover:underline cursor-pointer">📄 {t('mypage')}</div></Link>
                <Link href="/about"><div className="py-2 hover:underline cursor-pointer">📄 {t('about')}</div></Link>
                <Link href="/contact"><div className="py-2 hover:underline cursor-pointer">✉️ {t('contact')}</div></Link>

                {/* 다크모드 토글 */}
                <div className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2">🌗 <span>{t('dark_mode')}</span></span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleDarkMode} />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer dark:bg-gray-600 peer-checked:bg-blue-600 transition-all" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition peer-checked:translate-x-5" />
                  </label>
                </div>

                {/* 로그인 / 로그아웃 */}
                {user ? (
                  <div onClick={handleLogout} className="py-2 text-red-500 hover:underline cursor-pointer">🚪 {t('logout')}</div>
                ) : (
                  <Link href="/login"><div className="py-2 text-blue-500 hover:underline cursor-pointer">🔑 {t('login')}</div></Link>
                )}

                {/* 설정 */}
                <div className="pt-2 mt-2 border-t border-gray-300">
                  <button onClick={() => setSettingsOpen(p => !p)} className="w-full text-left hover:underline flex items-center gap-2">
                    ⚙️ {t('settings')}
                  </button>

                  {settingsOpen && (
                    <div className="mt-2 ml-4 space-y-2">
                      <Link href="/profile/edit"><div className="hover:underline cursor-pointer">✏️ {t('edit_profile')}</div></Link>

                      {/* 🌐 언어 설정 */}
                      <button onClick={() => setLangOpen(p => !p)} className="flex items-center gap-1 hover:underline">
                        🌐 {t('language')}
                      </button>

                      {langOpen && (
                        <div className="space-y-1 pl-4 pt-1">
                          {LOCALES.map(({ code, label }) => (
                            <button
                              key={code}
                              onClick={() => changeLocale(code)}
                              className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700
                                ${router.locale === code ? 'font-semibold text-blue-600' : ''}`}
                            >
                              {label} {router.locale === code && '✓'}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-3 sm:px-6">
          <Component {...pageProps} />
        </main>

        {/* ───────── 푸터 ───────── */}
        <footer className="w-full py-4 px-3 sm:px-6 text-center text-xs sm:text-sm bg-[var(--footer-bg)]">
          © {new Date().getFullYear()} WackyFoki ·{' '}
          <Link href="/terms" className="underline ml-1">{t('terms')}</Link> ·{' '}
          <Link href="/privacy" className="underline ml-1">{t('privacy')}</Link>
        </footer>
      </div>
    </>
  );
}

/* ───────── MyApp + provider ───────── */
function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <AppLayout Component={Component} pageProps={pageProps} />
    </UserProvider>
  );
}

/* 서버에서만 번역 JSON 동적 import → fs 모듈 오류 방지 */
MyApp.getInitialProps = async (appCtx) => {
  const App      = (await import('next/app')).default;
  const appProps = await App.getInitialProps(appCtx);
  const locale   = appCtx.ctx.locale || 'ko';

  let i18nProps = {};
  if (typeof window === 'undefined') {
    const { serverSideTranslations } =
      await import('next-i18next/serverSideTranslations');
    i18nProps = await serverSideTranslations(locale, ['common']);
  }

  return {
    ...appProps,
    pageProps: {
      ...appProps.pageProps,
      ...i18nProps,
    },
  };
};

export default appWithTranslation(MyApp, nextI18NextConfig);
