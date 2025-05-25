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

      <div
        className="min-h-screen flex flex-col"
        style={{
          background: darkMode ? '#121212' : '#ffffff',
          color: darkMode ? '#ffffff' : '#000000',
        }}
      >
        {/* ✅ 헤더 */}
        <header className="w-full px-6 py-4 flex justify-between items-center bg-white dark:bg-black relative">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/포키.png" alt="로고" className="w-8 h-8" />
            <span className="font-bold text-lg text-black dark:text-white tracking-tight">
              WACKY <span className="font-light">FOKI</span>
            </span>
          </Link>

          <nav className="flex items-center space-x-6 relative">
            <Link href="/about" className="text-sm text-black dark:text-white hover:underline">
              About
            </Link>
            <Link href="/contact" className="text-sm text-black dark:text-white hover:underline">
              Contact
            </Link>
            <Link href="/upload" className="bg-black text-white text-sm px-4 py-2 rounded hover:bg-gray-800 transition">
              Upload Recipe here
            </Link>

            {user && (
              <div className="text-sm text-black dark:text-white">
                {user.displayName || user.email}님
              </div>
            )}

            {/* ✅ 설정 버튼 */}
            <div className="relative inline-block text-left" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(prev => !prev)}
                className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded text-sm text-black dark:text-white"
              >
                ⚙ 설정
              </button>

              {settingsOpen && (
                <div className="absolute right-0 mt-2 bg-white dark:bg-black rounded shadow p-4 z-50 w-max min-w-[160px] overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">배경 모드</span>
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
        <footer className="w-full py-4 px-6 text-center text-sm" style={{ color: darkMode ? '#cccccc' : '#333333' }}>
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
