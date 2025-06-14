// pages/sitemap.xml.js
export async function getServerSideProps({ res }) {
  const baseUrl = 'https://wackyfoki.com';

  const staticPages = [
    '',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
  ];

  const urls = staticPages.map(path => {
    return `<url><loc>${baseUrl}${path}</loc></url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
