// pages/sitemap.xml.js
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export async function getServerSideProps({ res }) {
  const baseUrl = 'https://wackyfoki.com';
  const locales = ['ko', 'en', 'ja', 'zh'];

  const staticPaths = [
    '',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
  ];

  // 레시피 페이지들 가져오기
  const recipesSnapshot = await getDocs(collection(db, 'recipes'));
  const recipePaths = recipesSnapshot.docs.map(doc => `/recipe/${doc.id}`);

  // 정적 페이지와 레시피 페이지 합치기
  const allPaths = [...staticPaths, ...recipePaths];

  const urls = allPaths.map(path => {
    const links = locales.map(locale => {
      const localePath = locale === 'ko' ? path : `/${locale}${path}`;
      return `<xhtml:link rel="alternate" hreflang="${locale}" href="${baseUrl}${localePath}" />`;
    }).join('\n');

    // x-default (fallback)
    const xDefaultLink = `<xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${path}" />`;

    return `
      <url>
        <loc>${baseUrl}${path}</loc>
        ${links}
        ${xDefaultLink}
      </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${urls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'text/xml');
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function Sitemap() {
  return null;
}
