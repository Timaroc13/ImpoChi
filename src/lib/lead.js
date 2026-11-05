// Pure helpers shared by the lead form (browser) and the unit tests (node).

/** Strip everything but digits. */
export function digits(s) {
  return String(s ?? '').replace(/\D/g, '');
}

/**
 * Argentine CUIT/CUIL check: 11 digits, valid type prefix, mod-11 check digit.
 * Accepts dashes/spaces. Returns true for a structurally valid CUIT.
 */
export function isValidCuit(input) {
  const d = digits(input);
  if (d.length !== 11) return false;
  const prefix = d.slice(0, 2);
  if (!['20', '23', '24', '27', '30', '33', '34'].includes(prefix)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(d[i]) * weights[i];
  let check = 11 - (sum % 11);
  if (check === 11) check = 0;
  if (check === 10) return false; // AFIP reassigns these to prefix 23/33; never valid as-is
  return check === Number(d[10]);
}

/**
 * Phone check. For +54 numbers expects mobile format 54 9 <area+number, 10 digits>.
 * Other countries: 8–15 digits (E.164 range).
 */
export function normalizePhone(input) {
  let d = digits(input);
  if (!d) return { ok: false, e164: '' };
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('54')) {
    let rest = d.slice(2);
    if (rest.startsWith('0')) rest = rest.slice(1); // trunk prefix typed by mistake
    if (!rest.startsWith('9')) rest = '9' + rest; // WhatsApp needs the mobile 9
    // drop the legacy "15" after a 2–4 digit area code is too ambiguous to fix; length check only
    const ok = rest.length === 11;
    return { ok, e164: '+54' + rest };
  }
  const ok = d.length >= 8 && d.length <= 15;
  return { ok, e164: '+' + d };
}

export function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s ?? '').trim());
}

/** Order-value options; `qualifies` = at or above the USD 10k minimum. */
export const ORDER_VALUES = [
  { value: 'lt10k', label: 'Menos de USD 10.000', qualifies: false },
  { value: '10-25k', label: 'USD 10.000 a 25.000', qualifies: true },
  { value: '25-50k', label: 'USD 25.000 a 50.000', qualifies: true },
  { value: '50-150k', label: 'USD 50.000 a 150.000', qualifies: true },
  { value: 'gt150k', label: 'Más de USD 150.000', qualifies: true },
  { value: 'unknown', label: 'No sé todavía', qualifies: null },
];

export const TIMELINES = [
  { value: 'lt3m', label: 'En menos de 3 meses', within6m: true },
  { value: '3-6m', label: 'En 3 a 6 meses', within6m: true },
  { value: 'gt6m', label: 'En más de 6 meses', within6m: false },
  { value: 'exploring', label: 'Estoy explorando', within6m: false },
];

/**
 * Lead score per brief §10.5:
 * A = RI/sociedad "si" + value >= USD 10k + timeline <= 6 months; B = two of three; C = rest.
 */
export function leadScore({ ri, orderValue, timeline }) {
  const v = ORDER_VALUES.find((o) => o.value === orderValue);
  const t = TIMELINES.find((o) => o.value === timeline);
  const hits = [ri === 'si', v?.qualifies === true, t?.within6m === true].filter(Boolean).length;
  return hits === 3 ? 'A' : hits === 2 ? 'B' : 'C';
}

/** Route after submit: below the minimum goes to the polite page. */
export function thankYouPath(orderValue) {
  return orderValue === 'lt10k' ? '/gracias-chico' : '/gracias';
}

/** wa.me link with prefilled text. */
export function waLink(number, text) {
  const n = digits(number);
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
