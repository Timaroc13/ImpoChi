export interface Env {
  DB: D1Database;
  FILES?: R2Bucket;
  TURNSTILE_SECRET?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  ADMIN_PASSWORD?: string;
  FORWARD_URL?: string; // optional: n8n webhook that receives every lead as JSON
  FORWARD_SECRET?: string; // sent as X-DD-Secret to FORWARD_URL
  ALLOWED_ORIGINS?: string; // comma-separated; default = the request's own origin
  IP_SALT?: string;
}

// Minimal Cloudflare types so this compiles without @cloudflare/workers-types.
export interface D1Result<T = unknown> { results: T[] }
export interface D1PreparedStatement {
  bind(...v: unknown[]): D1PreparedStatement;
  first<T = unknown>(col?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<unknown>;
}
export interface D1Database { prepare(q: string): D1PreparedStatement }
export interface R2Object { body: ReadableStream; httpMetadata?: { contentType?: string }; size: number }
export interface R2Bucket {
  put(key: string, v: ArrayBuffer | ReadableStream, o?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(key: string): Promise<R2Object | null>;
}
export interface Ctx { request: Request; env: Env; params: Record<string, string | string[]>; waitUntil(p: Promise<unknown>): void }

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });

export async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Time-sortable id: 10 chars of base36 ms timestamp + 8 random chars. */
export function newId() {
  const rand = [...crypto.getRandomValues(new Uint8Array(8))].map((b) => (b % 36).toString(36)).join('');
  return Date.now().toString(36).padStart(10, '0') + rand;
}

/** HTTP Basic auth: any username, password = ADMIN_PASSWORD. */
export function checkAdmin(request: Request, env: Env): Response | null {
  const unauthorized = new Response('Autenticación requerida', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Dos Deltas leads", charset="UTF-8"', 'Cache-Control': 'no-store' },
  });
  if (!env.ADMIN_PASSWORD) return new Response('ADMIN_PASSWORD no configurado', { status: 503 });
  const h = request.headers.get('Authorization') || '';
  if (!h.startsWith('Basic ')) return unauthorized;
  let decoded = '';
  try { decoded = atob(h.slice(6)); } catch { return unauthorized; }
  const pass = decoded.slice(decoded.indexOf(':') + 1);
  // constant-time-ish compare
  const a = new TextEncoder().encode(pass);
  const b = new TextEncoder().encode(env.ADMIN_PASSWORD);
  if (a.length !== b.length) return unauthorized;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0 ? null : unauthorized;
}

export const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
