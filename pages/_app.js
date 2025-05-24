import '@/styles/globals.css';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function App({ Component, pageProps }) {
  const [darkMode, setDarkMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

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

      {/* ✅ 전체 페이지 구조 */}
      <div
        className="min-h-screen flex flex-col"
        style={{ background: 'var(--background)', color: 'var(--foreground)' }}
      >
        {/* ✅ 헤더 */}
        <header className="w-full px-6 py-4 flex justify-between items-center bg-white dark:bg-black relative">
          {/* 왼쪽: 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <img src="/포키.png" alt="로고" className="w-8 h-8" />
            <span className="font-bold text-lg text-black dark:text-white tracking-tight">
              WACKY <span className="font-light">FOKI</span>
            </span>
          </Link>

          {/* 오른쪽: 메뉴 */}
          <nav className="flex items-center space-x-6 relative">
            <a href="#" className="text-sm text-black dark:text-white hover:underline">Page</a>
            <a href="#" className="text-sm text-black dark:text-white hover:underline">Page</a>
            <a href="#" className="text-sm text-black dark:text-white hover:underline">Page</a>
            <Link
              href="/upload"
              className="bg-black text-white text-sm px-4 py-2 rounded hover:bg-gray-800 transition"
            >
              Upload Recipe here
            </Link>

            {/* ⚙ 설정 버튼 + 드롭다운 */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(prev => !prev)}
                className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded text-sm text-black dark:text-white"
              >
                ⚙ 설정
              </button>

              {settingsOpen && (
                <div className="absolute right-0 mt-2 bg-white dark:bg-black rounded shadow p-4 z-50">
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
                      >
                        {darkMode ? (
                          <span className="text-[10px] text-gray-800 block text-center">🌙</span>
                        ) : (
                          <span className="text-[10px] text-white block text-center">☀️</span>
                        )}
                      </div>
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
        <footer
          className="w-full py-4 px-6 text-center text-sm"
          style={{ color: 'var(--foreground)' }}
        >
          © {new Date().getFullYear()} WackyFoki. All rights reserved.
        </footer>
      </div>
    </>
  );
}
