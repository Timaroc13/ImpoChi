# Dos Deltas — probe site

Static lead-gen site for the China→Argentina sourcing probe (brief §10). Astro 5 + Tailwind 4, Spanish (es-AR, voseo), Dos Deltas design system tokens.

## Run

```bash
npm install
cp .env.example .env   # fill in values
npm run dev            # http://localhost:4321
npm test               # lead-scoring, CUIT, phone, landed-cost unit tests
npm run build          # → dist/
npm run og             # regenerate public/og/*.png and the sample PDF (uses Playwright)
npm run offline        # offline/dos-deltas-sitio.zip: preview copy that opens by double-click (form sends nothing)
```

## Pages

| URL | Notes |
| --- | --- |
| `/` | Home: hero, value props, verticals, sample quote table, money flow, process, fees, founder, form, FAQ |
| `/maquinaria`, `/packaging`, `/mobiliario` | Ad landing pages; one template (`src/components/VerticalPage.astro`), content in `src/data/verticals.ts` |
| `/como-trabajamos` | Process, payments/BCRA, deliverables, sample comparison + PDF, fees, scope |
| `/sobre-mi` | Founder; photo/video/LinkedIn come from env |
| `/cotizacion` | Form only. Accepts `?rubro=maquinaria|packaging|mobiliario|otro` |
| `/gracias`, `/gracias-chico` | Post-submit (noindex). `< USD 10k` routes to `/gracias-chico`. Booking: cal.com URLs embed inline, other URLs (Google Calendar) show a button tracked as `book_call_click` |
| `/preguntas-frecuentes` | All FAQs, FAQPage schema |
| `/recursos/costo-importar-china-argentina` | SEO pillar: worked landed-cost example + calculator |
| `/privacidad`, `/terminos` | Ley 25.326 notice; terms summary |

Commercial terms (fees, minimums, SLAs) live in one place: `TERMS` in `src/config.ts`.

## Lead form → Cloudflare

The short one-step form (`src/components/QuoteForm.astro`: rubro, need, order value, name, company, WhatsApp, optional email) posts to `/api/lead`, a Cloudflare Pages Function (`functions/api/lead.ts`):

1. origin check, honeypot, Turnstile, rate limit (5 per IP per 10 min);
2. server-side validation and lead score (A = USD 10k+, B = "No sé", C = below minimum) — the browser's values are not trusted;
3. insert into D1 (`migrations/0001_leads.sql`), attachments into R2;
4. Telegram alert with the attachments; optional JSON forward to n8n (`FORWARD_URL`).

`/api/telegram-test` sends a test alert and shows Telegram's exact error. `/api/leads.csv` exports every lead and `/api/files/<key>` serves attachments, both behind HTTP Basic auth (`ADMIN_PASSWORD`). Setup steps: **[docs/cloudflare-setup.md](docs/cloudflare-setup.md)**.

Local test of the function: `cp wrangler.example.toml wrangler.toml && npx wrangler d1 migrations apply DB --local && npm run build && npx wrangler pages dev`.

## Analytics

Consent Mode v2, default denied; GA4, Google Ads tag and Clarity load only after "Aceptar". Events (`window.ddTrack`): `form_start`, `form_step1_complete`, `generate_lead` (+ Ads conversion if `PUBLIC_GADS_LEAD_LABEL`), `whatsapp_click` (+ Ads conversion if `PUBLIC_GADS_WHATSAPP_LABEL`), `qualified_lead` (score A, GA4 only; import to Ads as offline conversion via gclid from the Sheet), `whatsapp_click {location}`, `book_call` (Cal.com), `sample_download`, `cta_click {cta_id}`, `scroll_75`, `faq_open {question}`. Mark `generate_lead` and `qualified_lead` as key events in GA4.

## Deploy (Cloudflare Pages)

Follow [docs/cloudflare-setup.md](docs/cloudflare-setup.md). `public/_headers` and `public/_redirects` are picked up automatically.

## Before launch — needs you

- [ ] **Logo SVGs**: the design-system blobs couldn't be downloaded from this session, so `public/brand/*.svg` and `Mark.astro` are rebuilt from the spec (two triangles, lower offset right). Swap in the exported files from the Logos group.
- [ ] Env values (WhatsApp +852 and the Google Calendar booking link are set in `.env.example`; brief prefers a +54 number),  LinkedIn, founder photo + 60–90 s video, Turnstile keys, Telegram bot, GA4/Ads/Clarity IDs. WhatsApp UI, video, photo and HK entity block stay hidden until set; the photo falls back to an "OM" block.
- [ ] HK company name/CR number/address once incorporated (never shown as a placeholder).
- [ ] Inspection-report sample PDF (brief §10.6) — not built; needs a real redacted report. The quote-comparison PDF is generated and labelled "Ejemplo ilustrativo · datos ficticios".
- [ ] Legal review of `/privacidad` and `/terminos` (data-controller identity, AAIP registration question, governing law, search-fee refund clause I added).
- [ ] Confirm operational claims I wrote into FAQs/examples: transit/production times, packaging MOQs, "40' ≈ 15–30 hotel rooms", FAT before balance, NNN with factories, 24-month non-circumvention, 24-month data retention.
- [ ] Design-system decisions to ratify: mobile type steps (display 40/44, h1 30/36) not in the system.

## Decisions taken

- **Voice: first person singular** ("te consigo", "no cobro comisión a la fábrica"), resolving the §10.12 open item. Reason: a solo founder writing "nosotros" overclaims capacity — exactly the "oficina en China" overreach §6 warns against. Switch later if you hire.
- **Minimum order USD 10.000 everywhere**, per §10. §5 says USD 15k for machinery — change `TERMS` / add a machinery override if you keep that.
- Brand voice rules override §10.4 copy: no exclamation marks (e.g. "¡Listo!" → "Listo.").
