'use client';

import '@/styles/globals.css';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { appWithTranslation, useTranslation } from 'next-i18next';
import nextI18NextConfig from '../next-i18next.config';

import { UserProvider, useUser } from '@/contexts/UserContext';
import { SearchProvider, useSearch } from '@/contexts/SearchContext';
import { CategoryProvider } from '@/contexts/CategoryContext';

import StickySearchBar from '@/components/StickySearchBar';
import CategoryButtons from '@/components/CategoryButtons';

const LOCALES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
];

function InnerLayout({ Component, pageProps }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { setKeyword, setSearchCategory } = useSearch();
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const dropdownRef = useRef(null);
  const { user, logout } = useUser();

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

  const changeLocale = (loc) => {
    router.push(router.asPath, undefined, { locale: loc, scroll: false }).then(() => {
      window.location.reload();
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors">
      <Head>
        <title>WackyFoki</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/포키.png" />
      </Head>

      {/* ✅ 통합 상단바 */}
      <header className="w-full px-3 sm:px-6 py-3 flex flex-col gap-2 bg-[var(--background)] z-40 shadow-sm">
        {/* 🔹 상단 로고 + 검색 + 메뉴 */}
        <div className="flex items-center justify-between gap-3">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/포키.png" alt="logo" className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="font-bold text-base sm:text-lg">
              WACKY <span className="font-light">FOKI</span>
            </span>
          </Link>

          {/* 검색창 */}
          <div className="flex-1 min-w-0">
            <div className="max-w-full sm:max-w-[44rem] mx-auto">
              <StickySearchBar
                onSearch={({ keyword, category }) => {
                  setKeyword(keyword);
                  setSearchCategory(category);
                }}
              />
            </div>
          </div>

          {/* 프로필 */}
          <div className="shrink-0 relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(p => !p)}
              className="w-10 h-10 rounded-full overflow-hidden border bg-white"
            >
              <img
                src={user?.photoURL || '/default-avatar.png'}
                alt="profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/default-avatar.png';
                }}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded shadow p-4 z-50 bg-[var(--header-bg)]">
                {user && <div className="font-semibold mb-2">{user.displayName}</div>}
                <Link href="/mypage"><div className="py-2 hover:underline cursor-pointer">📄 {t('mypage')}</div></Link>
                <Link href="/about"><div className="py-2 hover:underline cursor-pointer">📄 {t('about')}</div></Link>
                <Link href="/contact"><div className="py-2 hover:underline cursor-pointer">✉️ {t('contact')}</div></Link>

                <div className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2">🌗 <span>{t('dark_mode')}</span></span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleDarkMode} />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer dark:bg-gray-600 peer-checked:bg-blue-600 transition-all" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition peer-checked:translate-x-5" />
                  </label>
                </div>

                {user ? (
                  <div onClick={handleLogout} className="py-2 text-red-500 hover:underline cursor-pointer">🚪 {t('logout')}</div>
                ) : (
                  <Link href="/login"><div className="py-2 text-blue-500 hover:underline cursor-pointer">🔑 {t('login')}</div></Link>
                )}

                <div className="pt-2 mt-2 border-t border-gray-300">
                  <button onClick={() => setSettingsOpen(p => !p)} className="w-full text-left hover:underline flex items-center gap-2">
                    ⚙️ {t('settings')}
                  </button>

                  {settingsOpen && (
                    <div className="mt-2 ml-4 space-y-2">
                      <Link href="/profile/edit"><div className="hover:underline cursor-pointer">✏️ {t('edit_profile')}</div></Link>
                      <button onClick={() => setLangOpen(p => !p)} className="flex items-center gap-1 hover:underline">
                        🌐 {t('language')}
                      </button>

                      {langOpen && (
                        <div className="space-y-1 pl-4 pt-1">
                          {LOCALES.map(({ code, label }) => (
                            <button
                              key={code}
                              onClick={() => changeLocale(code)}
                              className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 ${
                                router.locale === code ? 'font-semibold text-blue-600' : ''
                              }`}
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
        </div>

        {/* 🔹 카테고리 버튼 (검색창 아래) */}
        <div className="overflow-x-auto no-scrollbar mt-2">
          <div className="flex gap-2 w-max justify-center mx-auto">
            <CategoryButtons />
          </div>
        </div>
      </header>

      {/* ✅ 메인 콘텐츠 */}
      <main className="flex-1 px-3 sm:px-6">
        <Component {...pageProps} />
      </main>

      {/* ✅ 하단 푸터 */}
      <footer className="w-full py-4 px-3 sm:px-6 text-center text-xs sm:text-sm bg-[var(--footer-bg)]">
        © {new Date().getFullYear()} WackyFoki ·{' '}
        <Link href="/terms" className="underline ml-1">{t('terms')}</Link> ·{' '}
        <Link href="/privacy" className="underline ml-1">{t('privacy')}</Link>
      </footer>
    </div>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <SearchProvider>
        <CategoryProvider>
          <InnerLayout Component={Component} pageProps={pageProps} />
        </CategoryProvider>
      </SearchProvider>
    </UserProvider>
  );
}

MyApp.getInitialProps = async (appCtx) => {
  const App = (await import('next/app')).default;
  const appProps = await App.getInitialProps(appCtx);
  const locale = appCtx.ctx.locale || 'ko';

  let i18nProps = {};
  if (typeof window === 'undefined') {
    const { serverSideTranslations } = await import('next-i18next/serverSideTranslations');
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
