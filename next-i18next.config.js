const path = require('path');

module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['ko', 'en', 'ja', 'zh'],
    localeDetection: false
  },
  fallbackLng: 'ko', // ✅ i18n 바깥으로 이동
  localePath: path.join(process.cwd(), 'public', 'locales'),
  reloadOnPrerender: process.env.NODE_ENV === 'development'
};
