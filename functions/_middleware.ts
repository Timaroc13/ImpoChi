// Runs before every request on Cloudflare Pages.
// www.dos-deltas.com → dos-deltas.com (301, keeps path and query). *.pages.dev is left alone for previews.
import type { Ctx } from './_lib/util';

export const onRequest = async ({ request, next }: Ctx & { next: () => Promise<Response> }) => {
  const url = new URL(request.url);
  if (url.hostname.startsWith('www.')) {
    url.hostname = url.hostname.slice(4);
    return Response.redirect(url.toString(), 301);
  }
  return next();
};
