// next-i18next.config.js
const path = require('path');

module.exports = {
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en', 'ja', 'zh'],   // 지원 언어만
    localeDetection: false,
    fallbackLng: 'ko',                   // 어떤 경우든 ko 로 대체
  },
  localePath: path.join(process.cwd(), 'public', 'locales'),
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
