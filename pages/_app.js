'use client';

import '@/styles/globals.css';
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { UserProvider, useUser } from '@/contexts/UserContext';

function AppLayout({ Component, pageProps }) {
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useUser();
  const router = useRouter();

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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>WackyFoki</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <link rel="icon" href="/포키.png" />
      </Head>

      <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 text-[14px] sm:text-[16px] font-sans">
        <header className="w-full px-4 sm:px-6 pt-4 sm:pt-6 pb-4 flex justify-between items-center relative transition-colors duration-300">
          {/* 로고 */}
          <Link href="/" className="flex items-center space-x-2">
            <img src="/포키.png" alt="로고" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
            <span className="font-bold text-base sm:text-lg tracking-tight text-[var(--foreground)]">
              WACKY <span className="font-light">FOKI</span>
            </span>
          </Link>

          {/* 오른쪽: 프로필 */}
          <div className="flex items-center space-x-3">
            {/* 👤 프로필 드롭다운 */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 bg-white"
              >
                <img
                  src={user?.photoURL || '/default-avatar.png'}
                  alt="프로필"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/default-avatar.png';
                  }}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 rounded shadow p-4 z-50 w-64 bg-[var(--header-bg)] text-[var(--foreground)] transition">
                  {user && (
                    <div className="font-semibold mb-2">{user.displayName}</div>
                  )}

                  <Link href="/profile/edit">
                    <div className="py-2 hover:underline cursor-pointer">👤 프로필</div>
                  </Link>
                  <Link href="/about">
                    <div className="py-2 hover:underline cursor-pointer">📄 About</div>
                  </Link>
                  <Link href="/contact">
                    <div className="py-2 hover:underline cursor-pointer">✉️ Contact</div>
                  </Link>

                  {/* 🌗 다크모드 토글 */}
                  <div className="flex items-center justify-between py-2">
                    <span className="flex items-center gap-2">
                      🌗 <span>다크모드</span>
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={darkMode}
                        onChange={toggleDarkMode}
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:bg-blue-600 transition-all"></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition peer-checked:translate-x-5" />
                    </label>
                  </div>

                  {user ? (
                    <div
                      onClick={handleLogout}
                      className="py-2 text-red-500 hover:underline cursor-pointer"
                    >
                      🚪 로그아웃
                    </div>
                  ) : (
                    <Link href="/login">
                      <div className="py-2 text-blue-500 hover:underline cursor-pointer">🔑 로그인</div>
                    </Link>
                  )}

                  <Link href="/settings">
                    <div className="pt-2 mt-2 border-t border-gray-300 hover:underline cursor-pointer">⚙️ 설정</div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 sm:px-6">
          <Component {...pageProps} />
        </main>

        <footer className="w-full py-4 px-3 sm:px-6 text-center text-xs sm:text-sm bg-[var(--footer-bg)] text-[var(--foreground)]">
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
