// Checks the built HTML (run `npm run test:build`, which builds first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const page = (p) => {
  const f = new URL(`../dist/${p}.html`, import.meta.url);
  assert.ok(existsSync(f), `dist/${p}.html missing: run npm run test:build`);
  return readFileSync(f, 'utf8');
};
const form = (html) => html.slice(html.indexOf('data-quote-form'), html.indexOf('</form>', html.indexOf('data-quote-form')));
const selectedRubro = (html) => {
  const sel = form(html).match(/<select[^>]*name="rubro"[\s\S]*?<\/select>/)[0];
  const m = sel.match(/<option value="([^"]*)"[^>]*selected/);
  return m ? m[1] : null;
};

test('rubro is preselected on sector pages and not on / or /cotizacion', () => {
  assert.equal(selectedRubro(page('maquinaria')), 'maquinaria');
  assert.equal(selectedRubro(page('packaging')), 'packaging');
  assert.equal(selectedRubro(page('mobiliario')), 'mobiliario');
  assert.equal(selectedRubro(page('index')), ''); // the "Elegí una opción" placeholder
  assert.equal(selectedRubro(page('cotizacion')), '');
});

test('every quote form: WhatsApp, email and empresa are not required on their own; core fields are', () => {
  for (const p of ['index', 'maquinaria', 'packaging', 'mobiliario', 'cotizacion']) {
    const f = form(page(p));
    const tag = (name) => f.match(new RegExp(`<(?:input|select|textarea)[^>]*name="${name}"[^>]*>`))[0];
    for (const name of ['whatsapp', 'email', 'empresa']) assert.doesNotMatch(tag(name), /\srequired/, `${p}: ${name}`);
    for (const name of ['rubro', 'valor_pedido', 'producto', 'nombre', 'consentimiento']) assert.match(tag(name), /\srequired/, `${p}: ${name}`);
    for (const name of ['empresa_web', 'utm_source', 'utm_campaign', 'utm_term', 'gclid', 'landing_page', 'pv']) assert.ok(tag(name), `${p}: ${name}`);
  }
});

test('first screen: headline, 3 proof lines, quote CTA and WhatsApp button on home and sector pages', () => {
  for (const [p, cta, wa] of [['index', 'hero-home', 'hero-home'], ['maquinaria', 'hero-maquinaria', 'hero-maquinaria'], ['packaging', 'hero-packaging', 'hero-packaging'], ['mobiliario', 'hero-mobiliario', 'hero-mobiliario']]) {
    const html = page(p);
    const main = html.slice(html.indexOf('<main'));
    const hero = main.slice(0, main.indexOf('</section>'));
    assert.match(hero, /<h1/, `${p}: h1 in first section`);
    assert.equal((hero.match(/<li /g) || []).length, 3, `${p}: 3 proof lines`);
    assert.match(hero, new RegExp(`href="#cotizar"[^>]*data-cta="${cta}"`), `${p}: quote CTA`);
    assert.match(hero, new RegExp(`data-wa="${wa}"`), `${p}: WhatsApp button`);
  }
});

test('sector pages: the quote form is the section right after the first screen', () => {
  for (const p of ['maquinaria', 'packaging', 'mobiliario']) {
    const main = page(p).slice(page(p).indexOf('<main'));
    const sections = main.split('<section').slice(1);
    assert.match(sections[1], /data-quote-form/, `${p}: form is section 2`);
    assert.equal((main.match(/data-quote-form/g) || []).length, 1, `${p}: one form`);
  }
});
