// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',        // ✅ pages 라우터
    './components/**/*.{js,ts,jsx,tsx}',   // ✅ 공통 컴포넌트
    './styles/**/*.css',                   // ✅ CSS
  ],
  theme: { extend: {} },
  plugins: [],
};
