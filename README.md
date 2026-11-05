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

## Lead form → CRM

Two-step native form (`src/components/QuoteForm.astro`) rather than a Tally embed: same fields/validation as §10.5, stays on-brand, no third-party JS. It POSTs `multipart/form-data` to `PUBLIC_FORM_ENDPOINT` (n8n Webhook node, "Binary data" on for attachments; Formspree also works).

Fields sent: `rubro, producto, especificaciones, archivos[], cantidad, precio_objetivo, valor_pedido, plazo, experiencia, nombre, empresa, ri, cuit (digits), cargo, whatsapp (E.164), email, provincia, consentimiento, utm_source/medium/campaign/term/content, gclid, landing_page, page, lead_score (A/B/C), enviado (ISO time)`.

UTMs/gclid are first-touch, kept 90 days in localStorage. Suggested n8n flow: Webhook → Google Sheets append → Telegram message (`lead_score`, `rubro`, `valor_pedido`, `empresa`, WhatsApp link). If the endpoint is missing or fails, the form keeps the data and shows a WhatsApp/email fallback.

## Analytics

Consent Mode v2, default denied; GA4, Google Ads tag and Clarity load only after "Aceptar". Events (`window.ddTrack`): `form_start`, `form_step1_complete`, `generate_lead` (+ Ads conversion if `PUBLIC_GADS_LEAD_LABEL`), `qualified_lead` (score A, GA4 only; import to Ads as offline conversion via gclid from the Sheet), `whatsapp_click {location}`, `book_call` (Cal.com), `sample_download`, `cta_click {cta_id}`, `scroll_75`, `faq_open {question}`. Mark `generate_lead` and `qualified_lead` as key events in GA4.

## Deploy (Cloudflare Pages)

Build `npm run build`, output `dist`, set env vars in the Pages project. `public/_headers` and `public/_redirects` are picked up automatically. `.com.ar` → `.com`: add the `.com.ar` zone to Cloudflare and a Redirect Rule (301, preserve path and query) to `https://dosdeltas.com`.

## Before launch — needs you

- [ ] **Logo SVGs**: the design-system blobs couldn't be downloaded from this session, so `public/brand/*.svg` and `Mark.astro` are rebuilt from the spec (two triangles, lower offset right). Swap in the exported files from the Logos group.
- [ ] Env values (WhatsApp +852 and the Google Calendar booking link are set in `.env.example`; brief prefers a +54 number),  LinkedIn, founder photo + 60–90 s video, form endpoint, GA4/Ads/Clarity IDs. WhatsApp UI, video, photo and HK entity block stay hidden until set; the photo falls back to an "OM" block.
- [ ] HK company name/CR number/address once incorporated (never shown as a placeholder).
- [ ] Inspection-report sample PDF (brief §10.6) — not built; needs a real redacted report. The quote-comparison PDF is generated and labelled "Ejemplo ilustrativo · datos ficticios".
- [ ] Legal review of `/privacidad` and `/terminos` (data-controller identity, AAIP registration question, governing law, search-fee refund clause I added).
- [ ] Confirm operational claims I wrote into FAQs/examples: transit/production times, packaging MOQs, "40' ≈ 15–30 hotel rooms", FAT before balance, NNN with factories, 24-month non-circumvention, 24-month data retention.
- [ ] Design-system decisions to ratify: mobile type steps (display 40/44, h1 30/36) not in the system.

## Decisions taken

- **Voice: first person singular** ("te consigo", "no cobro comisión a la fábrica"), resolving the §10.12 open item. Reason: a solo founder writing "nosotros" overclaims capacity — exactly the "oficina en China" overreach §6 warns against. Switch later if you hire.
- **Minimum order USD 10.000 everywhere**, per §10. §5 says USD 15k for machinery — change `TERMS` / add a machinery override if you keep that.
- Brand voice rules override §10.4 copy: no exclamation marks (e.g. "¡Listo!" → "Listo.").
