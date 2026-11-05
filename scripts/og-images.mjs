// Generates /public/og/*.png (1200×630) and the sample quote-comparison PDF with the preinstalled Playwright.
// Run: npm run og   (needs `playwright` resolvable; in CI use `npx -p playwright@<ver> node scripts/og-images.mjs`)
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ogDir = path.join(root, 'public/og');
const pdfDir = path.join(root, 'public/muestras');
mkdirSync(ogDir, { recursive: true });
mkdirSync(pdfDir, { recursive: true });

const FONTS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;600&family=Source+Serif+4:opsz,wght@8..60,600&display=block';
const MARK = (s) => `<svg viewBox="0 0 36 44" width="${(s * 36) / 44}" height="${s}"><polygon points="0,20 24,20 12,0" fill="#1f5560"/><polygon points="12,24 36,24 24,44" fill="#a9743a"/></svg>`;

const OG = [
  ['home', 'Sourcing en el sur de China', 'Comprá directo a fábricas en China, a través de alguien de confianza.'],
  ['maquinaria', 'Maquinaria y equipos', 'Especificaciones que sirvan en Argentina: 220/380 V, 50 Hz, repuestos.'],
  ['packaging', 'Envases y packaging', 'Packaging personalizado, comparado y controlado antes del saldo.'],
  ['mobiliario', 'Mobiliario comercial', 'Fábricas del sur de China para tu hotel, local u oficina.'],
  ['como-trabajamos', 'Cómo trabajo', 'Trabajo con el comprador, no con la fábrica, y sin comisiones.'],
  ['sobre-mi', 'Sobre mí', 'Soy Octa, argentino, vivo en Hong Kong.'],
  ['cotizacion', 'Pedí tu cotización', '2 a 4 cotizaciones comparables, con costo puesto en Argentina.'],
  ['preguntas-frecuentes', 'Preguntas frecuentes', 'Honorarios, pagos y BCRA, inspección, pedido mínimo.'],
  ['costo-importar', 'Costo de importar de China', 'De FOB a costo puesto en Argentina, paso a paso.'],
];

const ogHtml = (eyebrow, title) => `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${FONTS}">
<style>*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;background:#f5f2ec;color:#13262b;font-family:'IBM Plex Sans';position:relative;overflow:hidden}
.top{position:absolute;left:80px;top:72px;display:flex;align-items:center;gap:16px;font-family:'Source Serif 4';font-weight:600;font-size:40px}
.eq{position:absolute;left:0;right:0;top:430px;height:1px;background:#d6cfc2}
.eb{position:absolute;left:80px;top:170px;font-size:22px;letter-spacing:.06em;text-transform:uppercase;font-weight:600;color:#56656b}
h1{position:absolute;left:80px;top:208px;width:780px;font-family:'Source Serif 4';font-weight:600;font-size:52px;line-height:60px}
.foot{position:absolute;left:80px;top:470px;font-size:26px;color:#56656b}
.foot b{font-family:'IBM Plex Mono';font-weight:500;color:#1f5560}
.blk{position:absolute;right:0;bottom:0;width:180px;height:200px;background:#a9743a}.blk2{position:absolute;right:180px;bottom:200px;width:120px;height:200px;background:#1f5560}</style></head>
<body><div class="top">${MARK(44)}Dos Deltas</div><p class="eb">${eyebrow}</p><h1>${title}</h1><div class="eq"></div>
<p class="foot">Del lado del comprador · <b>dos-deltas.com</b></p><div class="blk"></div><div class="blk2"></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [file, eyebrow, title] of OG) {
  await page.setContent(ogHtml(eyebrow, title), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(ogDir, `${file}.png`) });
  console.log('og', file);
}

// Sample anonymised quote comparison (illustrative numbers, labelled as such)
const rows = [
  ['Fábrica A', '2009 · 120 empleados', 'USD 18.400', 'USD 24.840', '35 días', '1 equipo', 'Aprobado', ''],
  ['Fábrica B', '2012 · 85 empleados', 'USD 16.900', 'USD 22.980', '45 días', '1 equipo', 'Aprobado', 'rec'],
  ['Fábrica C', '2017 · 40 empleados', 'USD 15.200', 'USD 20.670', '50 días', '2 equipos', 'Observado', ''],
];
const pdfHtml = `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><link rel="stylesheet" href="${FONTS}">
<style>@page{size:A4 landscape;margin:16mm}*{box-sizing:border-box}body{font-family:'IBM Plex Sans';color:#13262b;background:#f5f2ec;font-size:12px;line-height:18px;margin:0}
.hd{display:flex;justify-content:space-between;align-items:center}.brand{display:flex;gap:10px;align-items:center;font-family:'Source Serif 4';font-weight:600;font-size:22px}
.tag{font-size:10px;letter-spacing:.06em;text-transform:uppercase;font-weight:600;color:#b0432a;border:1px solid #b0432a;padding:2px 6px}
h1{font-family:'Source Serif 4';font-weight:600;font-size:26px;line-height:32px;margin:18px 0 4px}.muted{color:#56656b}
.eq{height:1px;background:#d6cfc2;margin:14px 0}
table{width:100%;border-collapse:collapse;background:#fff}th,td{padding:8px 10px;text-align:left;vertical-align:top}
thead th{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#56656b;border-bottom:1px solid #13262b}
tbody tr{border-bottom:1px solid #d6cfc2}.n{font-family:'IBM Plex Mono';font-weight:500;text-align:right;white-space:nowrap}
.rec{background:#e3ecec}.chip{border:1px solid;padding:1px 6px;border-radius:2px;font-weight:600;font-size:11px}.ok{color:#1f5560}.obs{color:#b0432a}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}h2{font-family:'Source Serif 4';font-weight:600;font-size:16px;margin:0 0 6px}ul{margin:0;padding-left:16px}
.ft{position:fixed;bottom:0;left:0;right:0;font-size:10px;color:#56656b;display:flex;justify-content:space-between}</style></head><body>
<div class="hd"><div class="brand">${MARK(26)}Dos Deltas</div><span class="tag">Ejemplo ilustrativo · datos ficticios</span></div>
<h1>Comparación de cotizaciones: llenadora de líquidos, 6 picos</h1>
<p class="muted">Especificación común: 6 picos, 1.500 botellas/h (1 l), acero inoxidable 304, 380 V trifásica, 50 Hz, PLC con pantalla en español. Precios FOB.</p>
<div class="eq"></div>
<table><thead><tr><th>Fábrica</th><th>Perfil</th><th style="text-align:right">FOB</th><th style="text-align:right">Puesto en AR (est.)</th><th style="text-align:right">Plazo</th><th>Mínimo</th><th>Auditoría</th></tr></thead><tbody>
${rows.map((r) => `<tr class="${r[7]}"><td><b>${r[0]}</b>${r[7] ? '<br><span class="muted">recomendada</span>' : ''}</td><td class="muted">${r[1]}</td><td class="n">${r[2]}</td><td class="n">${r[3]}</td><td class="n">${r[4]}</td><td>${r[5]}</td><td><span class="chip ${r[6] === 'Aprobado' ? 'ok' : 'obs'}">${r[6]}</span></td></tr>`).join('')}
</tbody></table>
<p class="muted" style="margin-top:6px">Costo puesto en Argentina estimado a 1,35 × FOB, después de recuperar créditos fiscales (derecho 14 %, tasa de estadística, despachante y flete local). En la aduana se desembolsa cerca de 2 × FOB.</p>
<div class="eq"></div>
<div class="grid"><div><h2>Recomendación: Fábrica B</h2><ul><li>Cumple la especificación completa y entrega kit de repuestos de desgaste incluido.</li><li>Acepta 20 % contra aprobación de prueba en fábrica (FAT) y 80 % contra documentos de embarque.</li><li>Plazo 10 días más largo que A; precio 8 % menor.</li></ul></div>
<div><h2>Observaciones</h2><ul><li>Fábrica C: la auditoría encontró que terceriza el tablero eléctrico; no verificable antes del embarque.</li><li>Fábrica A: PLC solo en inglés y chino; cotiza la traducción aparte.</li><li>Nombres y contactos se comparten al avanzar con la ejecución, bajo acuerdo de no elusión.</li></ul></div></div>
<div class="ft"><span>Dos Deltas · Octavio Martínez — ITBA · London Business School</span><span>Sin comisiones de fábrica · dos-deltas.com</span></div>
</body></html>`;
await page.setContent(pdfHtml, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: path.join(pdfDir, 'comparacion-cotizaciones-ejemplo.pdf'), format: 'A4', landscape: true, printBackground: true });
console.log('pdf ok');
await browser.close();
