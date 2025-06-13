const path = require('path');

module.exports = {
  i18n: {
    defaultLocale: 'ko',
    locales: ['ko', 'en', 'ja', 'zh'],
    localeDetection: false,

    // ✅ 올바른 위치로 이동
    fallbackLng: 'ko',
  },
  localePath: path.join(process.cwd(), 'public', 'locales'),
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
