const { i18n } = require('./next-i18next.config');

module.exports = {
  reactStrictMode: true,

  // ✅ 최신 방식: deprecated된 `images.domains` 대신 `remotePatterns` 사용 권장
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**', // Firebase Storage URL 패턴
      },
    ],
  },

  i18n, // 국제화 설정 주입
};
