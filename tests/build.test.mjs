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

test('quick form on / and sector pages: WhatsApp + need + consent; rubro hidden from the page', () => {
  for (const [p, rubro] of [['index', ''], ['maquinaria', 'maquinaria'], ['packaging', 'packaging'], ['mobiliario', 'mobiliario']]) {
    const html = page(p);
    const f = form(html);
    const tag = (name) => (f.match(new RegExp(`<(?:input|select|textarea)[^>]*name="${name}"[^>]*>`)) || [null])[0];
    assert.match(f, /data-variant="quick"/, `${p}: quick variant`);
    assert.match(tag('whatsapp'), /\srequired/, `${p}: whatsapp required`);
    assert.match(tag('producto'), /<textarea[^>]*\srequired/, `${p}: producto textarea required`);
    assert.match(tag('consentimiento'), /\srequired/, `${p}: consent required`);
    assert.match(tag('rubro'), /type="hidden"/, `${p}: rubro hidden`);
    assert.match(tag('rubro'), rubro ? new RegExp(`value="${rubro}"`) : /\svalue(="")?[\s>]/, `${p}: rubro = ${rubro || '(empty)'}`);
    for (const gone of ['valor_pedido', 'nombre', 'empresa', 'email']) assert.equal(tag(gone), null, `${p}: no ${gone} field`);
    for (const name of ['empresa_web', 'utm_source', 'utm_campaign', 'utm_term', 'gclid', 'landing_page', 'pv', 'turnstile_state']) assert.ok(tag(name), `${p}: ${name}`);
    assert.match(f, /¿Qué necesitás traer de China\?/, `${p}: textarea label`);
    // order as rendered: whatsapp, producto, consent
    assert.ok(f.indexOf('name="whatsapp"') < f.indexOf('name="producto"') && f.indexOf('name="producto"') < f.indexOf('name="consentimiento"'), `${p}: field order`);
    const sec = html.slice(html.indexOf('id="cotizar"'), html.indexOf('data-quote-form'));
    assert.match(sec, /Pedido mínimo USD 10\.000/, `${p}: minimum order line above the form`);
  }
});

test('/cotizacion keeps the full form', () => {
  const f = form(page('cotizacion'));
  assert.match(f, /data-variant="full"/);
  for (const name of ['rubro', 'valor_pedido', 'producto', 'nombre', 'empresa', 'whatsapp', 'email', 'consentimiento']) assert.match(f, new RegExp(`name="${name}"`), name);
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
