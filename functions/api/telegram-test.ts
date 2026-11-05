// GET /api/telegram-test — sends a test alert and shows Telegram's answer. HTTP Basic auth, password = ADMIN_PASSWORD.
import { type Ctx, checkAdmin } from '../_lib/util';
import { sendTelegram } from '../_lib/telegram';

const HINTS: Record<string, string> = {
  'chat not found': 'TELEGRAM_CHAT_ID está mal, o nunca le escribiste al bot. Mandale "hola" al bot y volvé a sacar el chat id de getUpdates (el número dentro de "chat":{"id":...}, no el que está antes de los dos puntos del token).',
  Unauthorized: 'TELEGRAM_BOT_TOKEN está mal. Copialo de nuevo desde @BotFather, completo, sin espacios.',
  'bot was blocked by the user': 'Bloqueaste el bot en Telegram. Desbloquealo y mandale /start.',
  "bot can't initiate conversation with a user": 'Todavía no le escribiste al bot. Abrilo en Telegram y mandale /start.',
};

export const onRequestGet = async ({ request, env }: Ctx) => {
  const denied = checkAdmin(request, env);
  if (denied) return denied;
  const lines: string[] = [];
  lines.push(`TELEGRAM_BOT_TOKEN: ${env.TELEGRAM_BOT_TOKEN ? `configurado (${env.TELEGRAM_BOT_TOKEN.trim().length} caracteres)` : 'FALTA'}`);
  const chat = (env.TELEGRAM_CHAT_ID || '').trim();
  lines.push(`TELEGRAM_CHAT_ID: ${chat ? chat : 'FALTA'}`);
  const botId = (env.TELEGRAM_BOT_TOKEN || '').trim().replace(/^bot/i, '').split(':')[0];
  if (chat && botId && chat === botId) lines.push('⚠ El chat id es igual al id del bot (la parte del token antes de ":"). Ese no es tu chat id.');
  if (env.TELEGRAM_BOT_TOKEN && chat) {
    const res = await sendTelegram(env, 'sendMessage', JSON.stringify({ chat_id: chat, text: '✅ Prueba de Dos Deltas: las alertas de leads funcionan.' }));
    lines.push('');
    lines.push(res.ok ? 'Resultado: OK. Revisá Telegram.' : `Resultado: ERROR ${res.status}: ${res.description}`);
    const hint = Object.entries(HINTS).find(([k]) => res.description.includes(k));
    if (!res.ok && hint) lines.push(`Qué hacer: ${hint[1]}`);
  }
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
};
