# Prompt: Google Ads Search campaign for Dos Deltas

Copy everything below the line into Claude, ChatGPT, or send it to a freelancer.

---

You are a senior Google Ads Search specialist who writes in Argentine Spanish (rioplatense, voseo). Build a complete, ready-to-paste Google Ads **Search** campaign for the business below. This is a 4-week demand test with a very small budget, so precision beats reach.

## The business

- **Dos Deltas** (dos-deltas.com): an independent sourcing buyer in South China for Argentine SMEs (manufacturers and distributors, 10–150 employees, registered as Responsable Inscripto or SRL/SA).
- Founder: Octavio "Octa" Martínez, Argentine, based in Hong Kong. Studied at ITBA and London Business School.
- What the client gets: 2 to 4 comparable quotes from verified factories on identical specs, with the estimated landed cost in Argentina (duties, taxes, freight), in about 10 business days. Then negotiation, samples, production follow-up and pre-shipment inspection.
- Independence: works for the buyer, not the factory; takes no factory commissions.
- Fees: fixed search fee USD 300 (USD 500 for machinery), credited if the order goes ahead within 90 days; execution fee 5–7% of the order (minimum USD 800). **Minimum order USD 10.000.**
- Does NOT do customs clearance or international freight, and does not take orders under USD 10.000.
- Contact: quote form on each landing page, WhatsApp, reply within 24 business hours (Buenos Aires time).

## Ad groups and landing pages

| Ad group | Landing page (final URL) |
| --- | --- |
| Maquinaria | https://dos-deltas.com/maquinaria — packaging/filling machines, plastic injection, CNC and fibre laser, food-processing equipment, textile machinery. Key proof: 220/380 V, 50 Hz, spare parts and Spanish manuals verified before the balance is paid. |
| Packaging | https://dos-deltas.com/packaging — printed corrugated boxes, rigid boxes, kraft bags, PET/glass bottles and jars for cosmetics and cleaning (NOT food-contact), labels, POS displays. Key proof: colour and dimensions checked before the balance. |
| Mobiliario | https://dos-deltas.com/mobiliario — furniture and fit-out for hotels, restaurants, retail and offices. Key proof: finishes checked before shipment, whole-project quotes. |

Append UTM tags to every final URL: `?utm_source=google&utm_medium=cpc&utm_campaign=<ad group in lowercase>&utm_term={keyword}`.

## Budget and settings (state them in your output)

- Total ad spend about USD 120 over 4 weeks (about USD 4.30/day), account currency USD.
- Location: Argentina, targeting **people in or regularly in** Argentina (not "interested in").
- Language: Spanish. Schedule: Monday–Friday, 8:00–20:00 Buenos Aires time.
- Search network only (no Display, no Search Partners, no Performance Max, no "Smart" campaign).
- Bidding: Maximize Clicks with a max CPC cap, or manual CPC. Recommend a cap in USD and explain why.
- Primary conversion: `generate_lead` (form submit); secondary: `whatsapp_click`.

## Voice and content rules (strict)

- Argentine Spanish with voseo ("pedí", "contanos", "elegí"). Direct, professional, factual.
- Lead with numbers and facts: "2 a 4 cotizaciones", "costo puesto en Argentina", "sin comisiones de fábrica", "pedido mínimo USD 10.000".
- Argentine number format: dot for thousands (USD 10.000).
- **Never** use: exclamation marks, emoji, superlatives ("el mejor", "#1"), urgency ("últimos cupos"), "garantía", "cero riesgo", "certificado", "oficina en China", city names in China (Shenzhen, Foshan…), or claims of handling customs or freight.
- Avoid the words "importá", "comex" and "logística" in headlines.
- Pre-qualify: at least two headlines per ad group should filter out small buyers (e.g. mention the USD 10.000 minimum or "para pymes").

## Deliverables (in this order)

1. **Campaign settings** summary (as above, with your recommended CPC cap).
2. Per ad group:
   - **Keywords**: 10–20, exact `[ ]` and phrase `" "` match only, long-tail and commercial intent. Also mark which you expect to be the strongest.
   - **Responsive Search Ad**: 15 headlines (max 30 characters each) and 4 descriptions (max 90 characters each), in a table **with the character count of each line**. Suggest which headline to pin in position 1, if any. Two display-URL paths (max 15 characters each).
3. **Account-level negative keywords**: at least 40 (e.g. curso, gratis, pdf, aliexpress, temu, shein, mercadolibre, por menor, unidad, trabajo, empleo, monotributo, celulares, revender desde casa, emprendimiento, and more you think of).
4. **Assets**: 6 callouts (max 25 characters), 4 sitelinks (title max 25, two description lines max 35 each) pointing to /como-trabajamos, /sobre-mi, /preguntas-frecuentes and /recursos/costo-importar-china-argentina, and 1 structured snippet ("Tipos": the three sectors).
5. **Week-1 checklist**: what to check in the search-terms report and which thresholds mean pause or keep (CTR, CPC, cost per lead).

Double-check every character count before answering; Google rejects lines over the limit.
