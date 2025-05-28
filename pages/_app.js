import '@/styles/globals.css';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { UserProvider, useUser } from '@/contexts/UserContext';

function AppLayout({ Component, pageProps }) {
  const [darkMode, setDarkMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const user = useUser();

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    document.documentElement.classList.toggle('dark', prefersDark);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <Head>
        <title>WackyFoki</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <link rel="icon" href="/포키.png" />
      </Head>

      <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        {/* ✅ 헤더 */}
        <header className="w-full px-6 py-4 flex justify-between items-center relative transition-colors duration-300">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/포키.png" alt="로고" className="w-8 h-8" />
            <span className="font-bold text-lg tracking-tight text-[var(--foreground)]">
              WACKY <span className="font-light">FOKI</span>
            </span>
          </Link>

          <nav className="flex items-center space-x-6 relative">
            <Link href="/about" className="text-sm hover:underline text-[var(--foreground)]">
              About
            </Link>
            <Link href="/contact" className="text-sm hover:underline text-[var(--foreground)]">
              Contact
            </Link>
            <Link
              href="/upload"
              className="text-sm px-4 py-2 rounded transition bg-[var(--header-bg)] text-[var(--foreground)] hover:brightness-110"
            >
              Upload Recipe here
            </Link>

            {user && (
              <div className="text-sm text-[var(--foreground)]">
                {user.displayName || user.email}님
              </div>
            )}

            {/* ✅ 설정 버튼 */}
            <div className="relative inline-block text-left" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(prev => !prev)}
                className="px-3 py-2 rounded text-sm text-[var(--foreground)] bg-[var(--header-bg)] hover:brightness-110"
              >
                ⚙ 설정
              </button>

              {settingsOpen && (
                <div className="absolute right-0 mt-2 rounded shadow p-4 z-50 w-max min-w-[160px] overflow-hidden bg-[var(--header-bg)] text-[var(--foreground)] transition-colors duration-300">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm opacity-80">배경 모드</span>
                    <button
                      onClick={toggleDarkMode}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ease-in-out ${
                        darkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full shadow-md transform transition duration-300 ease-in-out ${
                          darkMode ? 'translate-x-6 bg-white' : 'translate-x-0 bg-black'
                        }`}
                      />
                    </button>
                  </div>

                  <Link href="/profile/edit">
                    <div className="text-sm hover:underline mt-1 cursor-pointer">
                      👤 프로필 설정
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </header>

        {/* ✅ 메인 콘텐츠 */}
        <main className="flex-1 px-4 sm:px-6">
          <Component {...pageProps} />
        </main>

        {/* ✅ 푸터 */}
        <footer className="w-full py-4 px-6 text-center text-sm bg-[var(--footer-bg)] text-[var(--foreground)]">
          © {new Date().getFullYear()} WackyFoki. All rights reserved. ·{' '}
          <Link href="/terms" className="underline hover:text-gray-500 ml-1">이용약관</Link> ·{' '}
          <Link href="/privacy" className="underline hover:text-gray-500 ml-1">개인정보 처리방침</Link>
        </footer>
      </div>
    </>
  );
}

export default function App(props) {
  return (
    <UserProvider>
      <AppLayout {...props} />
    </UserProvider>
  );
}
