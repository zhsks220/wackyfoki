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
  const recipes = recipesSnapshot.docs.map(doc => ({
    path: `/recipe/${doc.id}`,
    lastmod: doc.data().updatedAt || doc.data().createdAt
  }));

  // 정적 페이지들 (높은 우선순위)
  const staticUrls = staticPaths.map(path => {
    const links = locales.map(locale => {
      const localePath = locale === 'ko' ? path : `/${locale}${path}`;
      return `<xhtml:link rel="alternate" hreflang="${locale}" href="${baseUrl}${localePath}" />`;
    }).join('\n');

    const xDefaultLink = `<xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${path}" />`;

    return `
      <url>
        <loc>${baseUrl}${path}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>${path === '' ? 'daily' : 'weekly'}</changefreq>
        <priority>${path === '' ? '1.0' : '0.8'}</priority>
        ${links}
        ${xDefaultLink}
      </url>`;
  });

  // 레시피 페이지들 (중간 우선순위)
  const recipeUrls = recipes.map(recipe => {
    const links = locales.map(locale => {
      const localePath = locale === 'ko' ? recipe.path : `/${locale}${recipe.path}`;
      return `<xhtml:link rel="alternate" hreflang="${locale}" href="${baseUrl}${localePath}" />`;
    }).join('\n');

    const xDefaultLink = `<xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${recipe.path}" />`;
    
    // Firestore Timestamp를 ISO string으로 변환
    const lastmod = recipe.lastmod?.toDate ? 
      recipe.lastmod.toDate().toISOString() : 
      new Date().toISOString();

    return `
      <url>
        <loc>${baseUrl}${recipe.path}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
        ${links}
        ${xDefaultLink}
      </url>`;
  });

  const urls = [...staticUrls, ...recipeUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${urls.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function Sitemap() {
  return null;
}
