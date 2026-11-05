# Cloudflare setup — Dos Deltas

Everything runs on Cloudflare: the site (Pages), the form handler (Pages Function `/api/lead`), the lead database (D1), attachments (R2) and the captcha (Turnstile). Alerts go to Telegram. Time: about 1 hour. Cost: domain (~USD 10/yr) + nothing else at probe volume.

```
Form ──POST──▶ /api/lead ──▶ D1 "leads" table      (always, first)
                        ├──▶ R2 bucket              (attachments, if bound)
                        ├──▶ Telegram               (alert + attachments)
                        └──▶ n8n (optional)          (FORWARD_URL → Sheet, auto-reply)
```

## 1. Account and domain

1. Create a Cloudflare account at dash.cloudflare.com.
2. **dosdeltas.com**: Domain Registration → Register Domains → buy it there (at-cost, DNS is set up automatically).
3. **dosdeltas.com.ar** (optional, later): register at NIC Argentina (non-resident route on Trámites a Distancia), then in Cloudflare *Add a domain* and set the two Cloudflare nameservers at NIC. Add a Redirect Rule: all requests → `https://dosdeltas.com${path}` (301, preserve query string).

## 2. Database (D1)

1. Storage & Databases → D1 → **Create database** → name `dosdeltas-leads`.
2. Open it → **Console** → paste the contents of [`migrations/0001_leads.sql`](../migrations/0001_leads.sql) → Execute.

## 3. Attachments (R2) — optional

1. R2 Object Storage → enable it (asks for a card; free up to 10 GB) → **Create bucket** `dosdeltas-leads`.
2. Skip this step if you don't want to store files: attachments still reach you on Telegram, they just aren't kept.

## 4. Telegram bot

1. In Telegram, open **@BotFather** → `/newbot` → pick a name → copy the **token**.
2. Send any message to your new bot.
3. Open `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser and copy `"chat":{"id": …}` — that number is your **chat ID**.

## 5. Captcha (Turnstile)

Turnstile → **Add widget** → name `dosdeltas-form`, hostnames `dosdeltas.com` (add `<project>.pages.dev` too), mode **Managed** → copy the **site key** and **secret key**.

## 6. Pages project

1. Workers & Pages → **Create** → Pages → **Connect to Git** → GitHub → `timaroc13/ImpoChi`.
2. Production branch: `claude/new-session-5m55g2` (or `main` once you merge it).
3. Framework preset: **Astro**. Build command `npm run build`. Output directory `dist`.
4. **Settings → Variables and Secrets** (Production). `PUBLIC_*` values are read at build time, the rest by the function:

| Name | Type | Value |
| --- | --- | --- |
| `NODE_VERSION` | Text | `22` |
| `SITE_URL` | Text | `https://dosdeltas.com` |
| `PUBLIC_WHATSAPP_NUMBER` | Text | `85246632432` |
| `PUBLIC_BOOKING_URL` | Text | `https://calendar.app.google/4CbamWThfxTjwfrn7` |
| `PUBLIC_TURNSTILE_SITE_KEY` | Text | site key from step 5 |
| `TURNSTILE_SECRET` | **Secret** | secret key from step 5 |
| `TELEGRAM_BOT_TOKEN` | **Secret** | token from step 4 |
| `TELEGRAM_CHAT_ID` | Text | chat ID from step 4 |
| `ADMIN_PASSWORD` | **Secret** | a long random password (for the CSV export) |
| `IP_SALT` | **Secret** | any random string |
| `PUBLIC_GA4_ID`, `PUBLIC_GADS_ID`, `PUBLIC_GADS_LEAD_LABEL`, `PUBLIC_CLARITY_ID` | Text | when you have them |

   Do **not** set `PUBLIC_PREVIEW` or `PUBLIC_FORM_ENDPOINT` (empty = use `/api/lead`).

5. **Settings → Bindings**: add **D1 database** → variable name `DB` → `dosdeltas-leads`. Add **R2 bucket** → variable name `FILES` → `dosdeltas-leads` (if you did step 3).
6. **Deployments → Retry deployment** (variables and bindings only apply to new deployments).
7. **Custom domains** → add `dosdeltas.com` and `www.dosdeltas.com`.

## 7. Test

1. Open the site on your phone, submit the form with a PDF attached.
2. You should get a Telegram message within seconds, plus the PDF.
3. Download all leads: `https://dosdeltas.com/api/leads.csv` (any username, password = `ADMIN_PASSWORD`). Opens in Excel or Google Sheets.
4. Delete the test row: D1 → Console → `DELETE FROM leads WHERE empresa = 'Test SRL';`

## Day to day

- **Pipeline status:** D1 Console, e.g. `UPDATE leads SET estado = 'llamada', notas = 'Pidió muestras' WHERE id = '…';` States: `nuevo, contactado, llamada, fee_pagado, descartado`.
- **Weekly probe readout:** export the CSV, or in the Console:
  ```sql
  SELECT rubro, lead_score, COUNT(*) FROM leads GROUP BY rubro, lead_score ORDER BY rubro;
  ```
- **Attachments:** `https://dosdeltas.com/api/files/<key>` (key is in the `files` column), same password.
- **Optional n8n** for a Google Sheet or the auto-reply email: create a Webhook node (JSON body), set `FORWARD_URL` to its URL and `FORWARD_SECRET` to a random string, and check the `X-DD-Secret` header in n8n.

## Safeguards built in

- Origin check (only your site can post), hidden honeypot field, Turnstile, max 5 submissions per IP per 10 minutes.
- Server re-validates every field and recomputes the lead score; the browser's values are never trusted.
- The lead is written to D1 before any notification, so a Telegram or n8n outage never loses a lead.
- Files: PDF/JPG/PNG only, 10 MB total.
