import { copyFile, mkdir, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { resolve, basename, extname } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const read = (p) => readFile(resolve(root, p), 'utf8');
const shell = await read('src/index.html');
const pages = JSON.parse(await read('src/pages.json'));
const manifest = JSON.parse(await read('public/manus-routes.json'));
if (!Array.isArray(pages) || pages.length !== 8) throw new Error('O site deve declarar exatamente oito páginas públicas.');
const pagePaths = new Set();
const pageSlugs = new Set();
for (const page of pages) {
  if (!page.slug || !page.path || !page.file || pagePaths.has(page.path) || pageSlugs.has(page.slug)) throw new Error('Slug ou caminho de página ausente/duplicado.');
  if (page.path !== '/' && !/^\/[a-z0-9-]+$/.test(page.path)) throw new Error(`Caminho de página inválido: ${page.path}`);
  if (basename(page.file) !== page.file || extname(page.file) !== '.html') throw new Error(`Fragmento fora de src/pages: ${page.file}`);
  pagePaths.add(page.path); pageSlugs.add(page.slug);
}
const manifestPaths = (manifest.routes || []).map((route) => route.path).sort();
if (JSON.stringify([...pagePaths].sort()) !== JSON.stringify(manifestPaths)) throw new Error('O manifesto de rotas não corresponde às páginas do site.');
for (const marker of ['{{CONTENT}}', '{{TITLE}}', '{{DESCRIPTION}}', '{{SLUG}}']) if (!shell.includes(marker)) throw new Error(`O shell HTML não possui o marcador ${marker}.`);

const worker = await read('worker/index.js');
if (/\/\*__[A-Z_]+__\*\//.test(worker)) throw new Error('O Worker contém um marcador não resolvido.');

// CSS: partes numeradas de src/styles/ concatenadas em um único arquivo.
const partFiles = async (dir, ext) => (await readdir(resolve(root, dir))).filter((name) => name.endsWith(ext)).sort();
const cssParts = await partFiles('src/styles', '.css');
if (!cssParts.length) throw new Error('Nenhuma parte de CSS encontrada em src/styles.');
const css = (await Promise.all(cssParts.map(async (name) => `/* ${name} */\n${await read(`src/styles/${name}`)}`))).join('\n');
if (/@import/.test(css)) throw new Error('CSS não deve usar @import (CSP e desempenho).');

// JS: módulos numerados de src/js/ concatenados dentro de uma única função.
const jsParts = await partFiles('src/js', '.js');
if (!jsParts.length) throw new Error('Nenhum módulo JS encontrado em src/js.');
const js = `(() => {\n'use strict';\n${(await Promise.all(jsParts.map(async (name) => `/* ${name} */\n${await read(`src/js/${name}`)}`))).join('\n')}\n})();\n`;

await rm(resolve(root, 'dist'), { recursive: true, force: true });
await mkdir(resolve(root, 'dist/site/pages'), { recursive: true });
await mkdir(resolve(root, 'dist/site/fonts'), { recursive: true });
await mkdir(resolve(root, 'dist/media'), { recursive: true });
await writeFile(resolve(root, 'dist/worker.mjs'), worker);
await writeFile(resolve(root, 'dist/site/styles.css'), css);
await writeFile(resolve(root, 'dist/site/app.js'), js);
for (const [source, destination] of [['src/admin.html', 'admin.html'], ['src/admin.css', 'admin.css'], ['src/admin.js', 'admin.js'], ['public/manus-routes.json', 'manus-routes.json']]) {
  await writeFile(resolve(root, 'dist/site', destination), await read(source));
}
let builtPages = 0;
for (const page of pages) {
  const content = await read(`src/pages/${page.file}`);
  if (!content.trim() || content.includes('{{CONTENT}}')) throw new Error(`Fragmento inválido ou vazio: ${page.file}`);
  const html = shell.replace('{{CONTENT}}', () => content).replaceAll('{{TITLE}}', page.title).replaceAll('{{DESCRIPTION}}', page.description).replaceAll('{{SLUG}}', page.slug);
  if (/\{\{(?:CONTENT|TITLE|DESCRIPTION|SLUG)\}\}/.test(html)) throw new Error(`Marcador sem substituição na página ${page.slug}.`);
  await writeFile(resolve(root, 'dist/site', page.slug === 'home' ? 'index.html' : `pages/${page.file}`), html);
  builtPages += 1;
}
let fontCount = 0;
for (const entry of await readdir(resolve(root, 'public/assets/fonts'), { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.woff')) { await copyFile(resolve(root, 'public/assets/fonts', entry.name), resolve(root, 'dist/site/fonts', entry.name)); fontCount += 1; }
}
const mediaSource = resolve(root, 'public/assets/optimized');
const copiedMedia = [];
for (const entry of await readdir(mediaSource, { withFileTypes: true })) {
  if (!entry.isFile() || !/\.(?:webp|mp4|webm)$/.test(entry.name)) continue;
  await copyFile(resolve(mediaSource, entry.name), resolve(root, 'dist/media', entry.name));
  copiedMedia.push(entry.name);
}
if (!copiedMedia.length) throw new Error('Nenhuma imagem otimizada foi encontrada; rode npm run assets primeiro.');
console.log(`Worker: ${Buffer.byteLength(worker)} B; CSS: ${Buffer.byteLength(css)} B (${cssParts.length} partes); JS: ${Buffer.byteLength(js)} B (${jsParts.length} módulos); páginas: ${builtPages}; fontes: ${fontCount}; mídia R2: ${copiedMedia.length}.`);
