// Makes a copy of a built site that works when opened straight from disk (file://):
// - root-absolute links become relative .html links
// - ES-module scripts are re-bundled as classic scripts (browsers block modules on file://)
// Usage: node scripts/offline-copy.mjs <built-dir>   (build first with PUBLIC_PREVIEW=1)
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, rmSync, renameSync } from 'node:fs';
import path from 'node:path';
import { buildSync } from 'esbuild';

const root = path.resolve(process.argv[2] ?? 'dist');
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(path.join(d, f)).isDirectory() ? walk(path.join(d, f)) : [path.join(d, f)]));

for (const f of ['_headers', '_redirects', 'robots.txt', 'sitemap-index.xml', 'sitemap-0.xml']) rmSync(path.join(root, f), { force: true });
if (existsSync(path.join(root, '_astro'))) renameSync(path.join(root, '_astro'), path.join(root, 'assets'));

// Re-bundle each entry script as an IIFE.
const assets = path.join(root, 'assets');
const entries = readdirSync(assets).filter((f) => f.includes('_astro_type_script') && f.endsWith('.js'));
for (const f of entries) {
  const file = path.join(assets, f);
  const out = buildSync({ entryPoints: [file], bundle: true, format: 'iife', write: false, minify: true, logLevel: 'silent' });
  writeFileSync(file, out.outputFiles[0].text);
}

for (const file of walk(root).filter((f) => f.endsWith('.html'))) {
  const depth = path.relative(root, file).split(path.sep).length - 1;
  const pre = depth ? '../'.repeat(depth) : './';
  let s = readFileSync(file, 'utf8');
  s = s.replaceAll('/_astro/', '/assets/');
  s = s.replace(/<link rel="sitemap"[^>]*>/g, '');
  s = s.replace(/\b(href|src)="(\/[^"/][^"]*|\/)"/g, (m, attr, url) => {
    const [p0, frag = ''] = url.slice(1).split('#');
    const p = p0.split('?')[0];
    let t;
    if (p === '') t = 'index.html';
    else if (existsSync(path.join(root, p)) && statSync(path.join(root, p)).isFile()) t = p;
    else if (existsSync(path.join(root, p + '.html'))) t = p + '.html';
    else return m;
    return `${attr}="${pre}${t}${frag ? '#' + frag : ''}"`;
  });
  s = s.replace(/<script type="module" src="([^"]+)"><\/script>/g, '<script defer src="$1"></script>');
  writeFileSync(file, s);
}
console.log('offline copy ready:', root);
