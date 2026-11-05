const env = import.meta.env;

const clean = (v: string | undefined) => (v ?? '').trim();

export const SITE = {
  name: 'Dos Deltas',
  nameZh: '雙洲',
  lang: 'es-AR',
  locale: 'es_AR',
  tagline: 'Del delta del Río de las Perlas al del Paraná, con alguien de tu lado.',
  vp: 'Cotizaciones comparables de fábricas verificadas del sur de China, con el costo puesto en Argentina. Sin comisiones de fábrica.',
  founder: {
    name: 'Octavio Martínez',
    short: 'Octa',
    line: 'Octavio Martínez — ITBA · London Business School',
    photo: clean(env.PUBLIC_FOUNDER_PHOTO),
    video: clean(env.PUBLIC_FOUNDER_VIDEO),
    linkedin: clean(env.PUBLIC_LINKEDIN_URL),
  },
  email: clean(env.PUBLIC_CONTACT_EMAIL) || 'hola@dosdeltas.com',
  whatsapp: clean(env.PUBLIC_WHATSAPP_NUMBER).replace(/\D/g, ''),
  // Booking page. A cal.com URL is embedded inline on /gracias; any other URL (Google Calendar
  // appointment page, Calendly…) is shown as a button.
  booking: clean(env.PUBLIC_BOOKING_URL),
  // Preview builds (shared review links): the form does not send data.
  preview: clean(env.PUBLIC_PREVIEW) === '1',
  hk: {
    company: clean(env.PUBLIC_HK_COMPANY_NAME),
    number: clean(env.PUBLIC_HK_COMPANY_NUMBER),
    address: clean(env.PUBLIC_HK_ADDRESS),
  },
  hours: 'Respondo de lunes a viernes, 9 a 19 h (Argentina).',
  formEndpoint: clean(env.PUBLIC_FORM_ENDPOINT),
  analytics: {
    ga4: clean(env.PUBLIC_GA4_ID),
    gads: clean(env.PUBLIC_GADS_ID),
    gadsLeadLabel: clean(env.PUBLIC_GADS_LEAD_LABEL),
    clarity: clean(env.PUBLIC_CLARITY_ID),
  },
} as const;

/** Commercial terms. Single source for every page, the form and the FAQ. */
export const TERMS = {
  searchFee: 300,
  searchFeeMachinery: 500,
  execMin: 5,
  execMax: 7,
  execFloor: 800,
  minOrder: 10000,
  creditDays: 90,
  quotesMin: 2,
  quotesMax: 4,
  turnaroundDays: 10,
  replyHours: 24,
} as const;

export const calSlug = (() => {
  const m = SITE.booking.match(/^https?:\/\/(?:app\.)?cal\.com\/(.+?)\/?$/);
  return m ? m[1] : '';
})();

export const hasWhatsApp = SITE.whatsapp.length >= 8;
