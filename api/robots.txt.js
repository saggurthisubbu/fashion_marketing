export default function handler(req, res) {
  const robots = `# https://www.robotstxt.org/robotstxt.html
# Robots.txt for QuickFit Fashion (https://quickfitfashion.in/)

User-agent: Googlebot
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

User-agent: Googlebot-Image
Allow: /
Allow: /icons/
Allow: /uploads/
Allow: /placeholder-product.*

User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

# Sitemap location
Sitemap: https://quickfitfashion.in/sitemap.xml
`;

  res.setHeader('Content-Type', 'text/plain; charset=UTF-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  return res.status(200).send(robots);
}
