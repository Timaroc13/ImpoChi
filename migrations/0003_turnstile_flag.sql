-- Captcha result per lead: 'verified', 'unverified' (widget error, timeout, missing or rejected token) or 'not_configured'.
-- Unverified leads are still accepted (honeypot + per-IP rate limit) and flagged in Telegram.
ALTER TABLE leads ADD COLUMN turnstile TEXT;
