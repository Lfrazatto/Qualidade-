// Verificações estáticas do build: links internos, âncoras, ids duplicados e imagens locais.
import { readFile, readdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(new URL('..', import.meta.url).pathname);
const pages = JSON.parse(await readFile(resolve(root, 'src/pages.json'), 'utf8'));
const routes = new Set(pages.map((p) => p.path));
const html = new Map();
for (const page of pages) html.set(page.path, await readFile(resolve(root, 'dist/site', page.slug === 'home' ? 'index.html' : `pages/${page.file}`), 'utf8'));
const media = new Set(await readdir(resolve(root, 'dist/media')));
const css = await readFile(resolve(root, 'dist/site/styles.css'), 'utf8');
const errors = [];
for (const [path, doc] of html) {
  const ids = [...doc.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set();
  for (const id of ids) { if (seen.has(id)) errors.push(`${path}: id duplicado "${id}"`); seen.add(id); }
  for (const [, href] of doc.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(href)) { if (/^http:/.test(href)) errors.push(`${path}: link sem HTTPS ${href}`); continue; }
    const [pathname, hash] = href.split('#'); const [route] = (pathname || '').split('?');
    const target = route === '' ? path : route;
    if (target !== '/admin' && !routes.has(target)) errors.push(`${path}: rota inexistente ${href}`);
    if (hash && target !== '/admin') { const targetDoc = html.get(target); if (targetDoc && !new RegExp(`\\sid="${hash}"`).test(targetDoc) && !['topo', 'conteudo'].includes(hash)) errors.push(`${path}: âncora ausente ${href}`); }
  }
  for (const [, src] of doc.matchAll(/(?:src|srcset)="([^"]+)"/g)) for (const part of src.split(',')) { const file = part.trim().split(/\s+/)[0]; const m = file.match(/^\/media\/([a-z0-9._-]+)$/i); if (m && !media.has(m[1])) errors.push(`${path}: mídia ausente ${file}`); }
  for (const [, controls] of doc.matchAll(/aria-controls="([^"]+)"/g)) if (!seen.has(controls) && controls !== 'site-nav') errors.push(`${path}: aria-controls aponta para id ausente "${controls}"`);
  for (const [, tag] of doc.matchAll(/<img\b([^>]*)>/g)) if (!/\salt=/.test(tag)) errors.push(`${path}: <img> sem alt`);
  const open = (doc.match(/<(section|article|div|ul|ol|nav|figure|details|dialog|header|footer|main)\b/g) || []).length; const close = (doc.match(/<\/(section|article|div|ul|ol|nav|figure|details|dialog|header|footer|main)>/g) || []).length;
  if (open !== close) errors.push(`${path}: tags de bloco desbalanceadas (${open} abrem, ${close} fecham)`);
}
if (/\.(?:\w+)\{[^}]*\bundefined\b/.test(css)) errors.push('CSS contém "undefined"');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Verificação estática: ${html.size} páginas, links internos, âncoras, ids, mídia e alt conferidos.`);
