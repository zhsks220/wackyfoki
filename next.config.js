const { i18n } = require('./next-i18next.config');

module.exports = {
  reactStrictMode: true,
  i18n,

  images: {
    // ✅ deprecated 된 domains 대신 remotePatterns 사용
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
    ],
  },
};
