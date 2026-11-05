import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) =>
  new Response(
    `# Guía para modelos de lenguaje: ${new URL("/llms.txt", site).href}\n\nUser-agent: *\nAllow: /\nDisallow: /gracias\nDisallow: /gracias-chico\nDisallow: /muestras/\n\nSitemap: ${new URL('/sitemap-index.xml', site).href}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
