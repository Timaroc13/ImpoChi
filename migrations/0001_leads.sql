-- Leads captured by the /cotizacion form. One row per submission.
CREATE TABLE IF NOT EXISTS leads (
  id              TEXT PRIMARY KEY,           -- ULID-like, sortable by time
  created_at      TEXT NOT NULL,              -- ISO 8601 UTC
  lead_score      TEXT NOT NULL,              -- A / B / C, computed server-side
  rubro           TEXT NOT NULL,
  producto        TEXT NOT NULL,
  especificaciones TEXT,
  cantidad        TEXT NOT NULL,
  precio_objetivo TEXT,
  valor_pedido    TEXT NOT NULL,
  plazo           TEXT NOT NULL,
  experiencia     TEXT,
  nombre          TEXT NOT NULL,
  empresa         TEXT NOT NULL,
  ri              TEXT NOT NULL,
  cuit            TEXT,
  cargo           TEXT,
  whatsapp        TEXT NOT NULL,              -- E.164
  email           TEXT NOT NULL,
  provincia       TEXT,
  consentimiento  TEXT NOT NULL,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_term        TEXT,
  utm_content     TEXT,
  gclid           TEXT,
  landing_page    TEXT,
  page            TEXT,
  files           TEXT,                       -- JSON array of {key,name,size,type}
  ip_hash         TEXT,                       -- salted SHA-256, for rate limiting only
  country         TEXT,                       -- Cloudflare geo (CF-IPCountry)
  user_agent      TEXT,
  -- pipeline columns you update by hand (wrangler d1 execute / dashboard)
  estado          TEXT NOT NULL DEFAULT 'nuevo',  -- nuevo, contactado, llamada, fee_pagado, descartado
  notas           TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_ip ON leads(ip_hash, created_at);
