const { i18n } = require('./next-i18next.config');

module.exports = {
  reactStrictMode: true,
  images: { domains: ['firebasestorage.googleapis.com'] },
  i18n,               // ← Next 자체 라우팅에 i18n 주입
};
