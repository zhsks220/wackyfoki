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
  const isHome = router.pathname === '/';

  const { setKeyword, setSearchCategory } = useSearch();
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const dropdownRef = useRef(null);
  const { user, logout, isLoading } = useUser();

  // ✅ 닉네임 없으면 /profile/edit 강제 이동
  useEffect(() => {
    if (isLoading) return;

    const noNickname =
      user &&
      user.agreed === true &&
      (!user.displayName || user.displayName.trim() === '');

    const notEditPage = router.pathname !== '/profile/edit';

    if (noNickname && notEditPage) {
      router.replace('/profile/edit');
    }
  }, [user, isLoading, router]);

  // ✅ 쿠팡 파트너스 광고 로드
  useEffect(() => {
    // 스크립트 로드
    const script1 = document.createElement('script');
    script1.src = 'https://ads-partners.coupang.com/g.js';
    script1.async = true;
    document.body.appendChild(script1);

    script1.onload = () => {
      // 광고 초기화
      if (window.PartnersCoupang) {
        new window.PartnersCoupang({
          id: 890449,
          template: "carousel",
          trackingCode: "AF6458698",
          width: "160",
          height: "600",
          tsource: "",
          container: document.getElementById('coupang-partners-ad')
        });
      }
    };

    return () => {
      // 클린업
      if (document.body.contains(script1)) {
        document.body.removeChild(script1);
      }
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    const prefers = stored === null ? matchMedia('(prefers-color-scheme: dark)').matches : stored === 'true';
    setDarkMode(prefers);
    document.documentElement.classList.toggle('dark', prefers);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', next);
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  const changeLocale = (loc) => {
    const storedDark = localStorage.getItem('darkMode');
    router.push(router.asPath, undefined, { locale: loc, scroll: false }).then(() => {
      if (storedDark === 'true') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      window.location.reload();
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
    if (confirm(t('confirm_logout'))) {
      await logout();
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors">
      <Head>
        <title>{t('meta_title')}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="description"           content={t('meta_description')} />
        <meta property="og:title"          content={t('meta_title')} />
        <meta property="og:description"    content={t('meta_description')} />
        <meta property="og:image"          content="https://wackyfoki.com/og-image.png" />
        <meta property="og:url"            content="https://wackyfoki.com" />
        <meta name="twitter:card"          content="summary_large_image" />
        <meta name="twitter:title"         content={t('meta_title')} />
        <meta name="twitter:description"   content={t('meta_description')} />
        <meta name="twitter:image"         content="https://wackyfoki.com/og-image.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type":    "Organization",
              name:       "WackyFoki",
              url:        "https://wackyfoki.com",
              logo:       "https://wackyfoki.com/logo.png"
            })
          }}
        />
      </Head>

      {/* 왼쪽 카카오 애드핏 광고 */}
      <div className="hidden lg:block fixed left-0 top-44 z-40 w-[160px] h-[600px]">
        <ins 
          className="kakao_ad_area" 
          style={{ display: "none" }}
          data-ad-unit="DAN-jGv3PEktX9ANGtVL"
          data-ad-width="160"
          data-ad-height="600"
        />
      </div>

      {/* 오른쪽 쿠팡 파트너스 광고 */}
      <div className="hidden lg:block fixed right-0 top-44 z-40 w-[160px] h-[600px]">
        <div id="coupang-partners-ad" />
      </div>

      <header className="w-full px-3 sm:px-6 py-3 flex flex-col gap-2 bg-[var(--background)] z-40 shadow-sm">
        <div className="flex items-center justify-between gap-3 relative">
          <Link href="/" className="flex items-center gap-2 shrink-0 z-10">
            <img src="/favicon.ico" alt="logo" className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="font-bold text-base sm:text-lg">
              WACKY <span className="font-light">FOKI</span>
            </span>
          </Link>

          {isHome && (
            <div className="hidden sm:flex absolute left-0 right-0 justify-center">
              <div className="w-full max-w-[44rem] px-3">
                <StickySearchBar
                  onSearch={({ keyword, category }) => {
                    setKeyword(keyword);
                    setSearchCategory(category);
                  }}
                />
              </div>
            </div>
          )}

          <div className="shrink-0 relative z-10" ref={dropdownRef}>
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
                {user && <div className="font-semibold mb-2">{user.displayName || user.email}</div>}
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

        {isHome && (
          <>
            <div className="sm:hidden mt-2">
              <StickySearchBar
                onSearch={({ keyword, category }) => {
                  setKeyword(keyword);
                  setSearchCategory(category);
                }}
              />
            </div>

            <div className="overflow-x-auto no-scrollbar mt-2">
              <div className="flex gap-2 w-max justify-center mx-auto">
                <CategoryButtons />
              </div>
            </div>
          </>
        )}
      </header>

      <main className="flex-1 px-3 sm:px-6">
        <Component {...pageProps} />
      </main>

      {/* 하단 광고 - 임시로 숨김 처리 */}
      {/* <div className="w-full flex justify-center py-8">
        <div className="w-full max-w-[728px] h-[90px] bg-gray-200 rounded shadow-sm flex items-center justify-center">
          하단 광고 자리
        </div>
      </div> */}

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
