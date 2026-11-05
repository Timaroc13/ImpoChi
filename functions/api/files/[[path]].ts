// GET /api/files/leads/<id>/<name> — download an attachment from R2. HTTP Basic auth, password = ADMIN_PASSWORD.
import { type Ctx, checkAdmin } from '../../_lib/util';

export const onRequestGet = async ({ request, env, params }: Ctx) => {
  const denied = checkAdmin(request, env);
  if (denied) return denied;
  if (!env.FILES) return new Response('R2 no configurado', { status: 503 });
  const key = (Array.isArray(params.path) ? params.path : [params.path]).map(decodeURIComponent).join('/');
  if (!key.startsWith('leads/') || key.includes('..')) return new Response('No encontrado', { status: 404 });
  const obj = await env.FILES.get(key);
  if (!obj) return new Response('No encontrado', { status: 404 });
  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${key.split('/').pop()!.replace(/"/g, '')}"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
