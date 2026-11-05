import type { Env } from './util';

/** Calls the Telegram Bot API and returns Telegram's own verdict (never the token). */
export async function sendTelegram(env: Env, method: string, body: string | FormData) {
  const token = (env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^bot/i, '');
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: typeof body === 'string' ? { 'Content-Type': 'application/json' } : undefined,
      body,
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    return { ok: !!data.ok, status: res.status, description: data.description || '' };
  } catch (err) {
    return { ok: false, status: 0, description: String(err) };
  }
}
