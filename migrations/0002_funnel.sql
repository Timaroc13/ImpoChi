-- Cookieless funnel counters (see src/lib/funnel.js). No personal data: no IP, no cookies, no form contents.
CREATE TABLE IF NOT EXISTS funnel_events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at   TEXT NOT NULL,          -- ISO 8601 UTC
  event        TEXT NOT NULL,          -- form_view, form_start, submit_pressed, submit_blocked, turnstile_fail, submit_success
  path         TEXT NOT NULL,          -- page path, e.g. /maquinaria
  utm_campaign TEXT NOT NULL DEFAULT '',
  utm_term     TEXT NOT NULL DEFAULT '',
  device       TEXT NOT NULL,          -- mobile / desktop
  detail       TEXT NOT NULL DEFAULT '', -- blocking field or turnstile failure reason
  pv           TEXT NOT NULL,          -- random per-page-load id, only for de-duplication
  UNIQUE (pv, event, detail)
);
CREATE INDEX IF NOT EXISTS idx_funnel_created ON funnel_events(created_at);
