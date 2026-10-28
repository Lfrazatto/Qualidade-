// Pré-visualização local: executa o Worker real (dist/worker.mjs) com D1/R2 simulados.
// ATENÇÃO: os dados abaixo são fixtures só para desenvolvimento local; nunca são publicados.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(new URL('../..', import.meta.url).pathname);
const { default: worker } = await import(pathToFileURL(resolve(root, 'dist/worker.mjs')).href);
const port = Number(process.env.PORT || 8787);

const sources = [
  { id: 'src-iveco-history', title: 'Iveco Group — Our history', publisher: 'Iveco Group', url: 'https://www.ivecogroup.com/group/about_us/our_history', published_at: '', accessed_at: '2026-10-22', summary: 'História oficial do Iveco Group.', license: '' },
  { id: 'src-eea', title: 'Cummins announces conclusion of joint ventures with CNH', publisher: 'Cummins Investor Relations', url: 'https://investor.cummins.com/news/detail/58/cummins-announces-conclusion-of-joint-ventures-with-cnh', published_at: '2008-07-18', accessed_at: '2026-10-22', summary: 'Comunicado sobre a conclusão da European Engine Alliance.', license: '' },
  { id: 'src-meritor', title: 'Cummins completes acquisition of Meritor', publisher: 'Cummins', url: 'https://www.cummins.com/en-na/news/releases/2022/08/03/cummins-completes-acquisition-meritor', published_at: '2022-08-03', accessed_at: '2026-10-22', summary: 'Comunicado da aquisição.', license: '' },
  { id: 'src-sway', title: 'IVECO S-Way — IVECO Brasil', publisher: 'IVECO Brasil', url: 'https://iveco.com.br/sway/', published_at: '', accessed_at: '2026-10-22', summary: 'Página do modelo.', license: '' },
  { id: 'src-wiki', title: 'IVECO S-Way 500 — Wikimedia Commons', publisher: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Iveco_S-Way_500_AS440S50T_FP_IAA_Transportation_2024_%28DSC04500%29.jpg', published_at: '', accessed_at: '2026-10-22', summary: 'Fotografia.', license: 'CC BY-SA 4.0' },
];
const timeline = [
  { id: 't1', subject: 'iveco', date_label: '1975', sort_order: 10, title: 'União de cinco fabricantes', body: 'Fixture local: união de marcas que formou a IVECO.', source_title: sources[0].title, source_url: sources[0].url },
  { id: 't2', subject: 'connection', date_label: '1996', sort_order: 20, title: 'European Engine Alliance', body: 'Fixture local: aliança de motores entre Cummins, Iveco e New Holland.', source_title: sources[1].title, source_url: sources[1].url },
  { id: 't3', subject: 'connection', date_label: '2008', sort_order: 30, title: 'Conclusão da aliança', body: 'Fixture local: a Cummins vendeu sua participação de um terço.', source_title: sources[1].title, source_url: sources[1].url },
  { id: 't4', subject: 'cummins', date_label: '2022', sort_order: 40, title: 'Aquisição da Meritor', body: 'Fixture local: Cummins conclui a aquisição da Meritor.', source_title: sources[2].title, source_url: sources[2].url },
];
const models = [
  { id: 'm-daily', brand: 'IVECO', model: 'Daily Hi-Matic', version: 'Fixture', year: '', region: 'Brasil', category: 'Leves', summary: 'Fixture local de ficha.', image_key: 'media/daily-archive.webp', image_alt_text: 'Daily 35C15 de 2011', image_caption: 'Daily 35C15 Mk4, 2011, arquivo.', image_license: 'CC BY-SA 4.0', image_attribution: 'Lukas 3z', image_source_url: 'https://commons.wikimedia.org/wiki/File:Iveco_Daily_35C15_truck_%281%29.jpg', source_url: 'https://iveco.com.br/daily-hi-matic/', source_title: 'IVECO Brasil' },
  { id: 'm-tector', brand: 'IVECO', model: 'Tector', version: 'Fixture', year: '', region: 'Brasil', category: 'Médios', summary: 'Fixture local de ficha.', image_key: 'media/tector-profile.webp', image_alt_text: 'Tector', image_caption: 'Tector, versão não informada.', image_license: 'CC BY-SA 2.0', image_attribution: 'Bob Adams', image_source_url: 'https://commons.wikimedia.org/wiki/File:Iveco_Tector_%2811815139926%29.jpg', source_url: '', source_title: '' },
  { id: 'm-sway', brand: 'IVECO', model: 'S-Way', version: 'Fixture', year: '', region: 'Brasil', category: 'Pesados', summary: 'Fixture local de ficha.', image_key: 'media/sway-hero.webp', image_alt_text: 'S-Way', image_caption: 'S-Way 500, IAA 2024.', image_license: 'CC BY-SA 4.0', image_attribution: 'MarcelX42', image_source_url: sources[4].url, source_url: sources[3].url, source_title: 'IVECO Brasil' },
];
const specs = [{ id: 's1', model_id: 'm-sway', label: 'Potência', value: '460 / 480 / 540', unit: 'cv', conditions: 'Fixture local', source_id: 'src-sway' }];
const hotspots = [
  { id: 'h1', model_id: null, slug: 'cab', label: 'Cabine e área envidraçada', x_pct: 40, y_pct: 37, explanation: 'Fixture: para-brisa e retrovisores visíveis.', source_id: 'src-wiki', sort_order: 1 },
  { id: 'h2', model_id: null, slug: 'grille', label: 'Grade frontal', x_pct: 31, y_pct: 68, explanation: 'Fixture: grade e emblema visíveis.', source_id: 'src-wiki', sort_order: 2 },
  { id: 'h3', model_id: null, slug: 'wheel', label: 'Roda dianteira', x_pct: 61, y_pct: 81, explanation: 'Fixture: roda e pneu visíveis.', source_id: 'src-wiki', sort_order: 3 },
];
const quiz = [
  { id: 'q1', prompt: 'Em que período a European Engine Alliance existiu, segundo a Cummins?', options_json: JSON.stringify(['1996 a 2008', '1975 a 1996', '2008 a 2022']), correct_option: 0, explanation: 'Fixture: o comunicado registra a aliança entre 1996 e 2008.', source_title: sources[1].title, source_url: sources[1].url },
  { id: 'q2', prompt: 'Pergunta de fixture 2?', options_json: JSON.stringify(['A', 'B']), correct_option: 1, explanation: 'Fixture.', source_title: '', source_url: '' },
];
const settings = { quiz_enabled: 'true', hero_image_key: 'media/sway-hero.webp', explorer_image_key: 'media/tector-fenatran.webp', ...(process.env.PREVIEW_VIDEO ? { hero_video_key: 'media/preview.mp4' } : {}) };
const asset = (key) => ({ key, alt_text: 'Fixture', caption: key.includes('sway') ? 'IVECO S-Way 500 AS440S50T/FP · IAA Transportation 2024' : 'IVECO Tector de 8 t · Fenatran 2017', license: 'CC BY-SA 4.0', attribution: key.includes('sway') ? 'MarcelX42' : 'Rayzakamke', source_url: 'https://creativecommons.org/licenses/by-sa/4.0/', mime_type: key.endsWith('.mp4') ? 'video/mp4' : 'image/webp' });

const DB = { prepare(sql) {
  const q = { args: [], bind(...a) { q.args = a; return q; },
    async all() {
      const results = /FROM content_pages/.test(sql) ? [] : /FROM timeline_events/.test(sql) ? timeline : /FROM truck_models/.test(sql) ? models : /FROM model_specs/.test(sql) ? specs : /FROM truck_hotspots/.test(sql) ? hotspots : /FROM sources/.test(sql) ? sources : /FROM quiz_questions/.test(sql) ? quiz : [];
      return { results };
    },
    async first() {
      if (/FROM site_settings WHERE key='(\w+)'/.test(sql)) { const k = sql.match(/key='(\w+)'/)[1]; return settings[k] ? { value: settings[k] } : null; }
      if (/FROM media_assets/.test(sql)) return asset(q.args[0]);
      if (/q\.correct_option/.test(sql)) { const f = quiz.find((x) => x.id === q.args[0]); return f ? { correct_option: f.correct_option, explanation: f.explanation, options_json: f.options_json, source_title: f.source_title, source_url: f.source_url } : null; }
      return null;
    } };
  return q;
} };
const MEDIA = {
  async head(key) { return (await load(key)) ? {} : null; },
  async get(key, opts) {
    const buf = await load(key); if (!buf) return null;
    let body = buf; let range;
    const h = opts?.range?.get?.('range'); const m = h && h.match(/bytes=(\d*)-(\d*)/);
    if (m) { const start = m[1] ? Number(m[1]) : 0; const end = m[2] ? Math.min(Number(m[2]), buf.length - 1) : buf.length - 1; body = buf.subarray(start, end + 1); range = { offset: start, length: end - start + 1 }; }
    return { body, size: buf.length, range, httpEtag: '"x"', writeHttpMetadata() {} };
  },
};
async function load(key) {
  const path = key.startsWith('site/') ? resolve(root, 'dist', key) : resolve(root, 'dist', key);
  try { await stat(path); return await readFile(path); } catch { return null; }
}
const env = { DB, MEDIA, ADMIN_EMAIL: 'x@example.com', ACCESS_TEAM_DOMAIN: '', ACCESS_APP_AUD: '' };
createServer(async (req, res) => {
  try {
    const url = `http://localhost:${port}${req.url}`;
    const response = await worker.fetch(new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(await (async () => { const parts = []; for await (const part of req) parts.push(part); return parts; })()) }), env, {});
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) { res.writeHead(500); res.end(String(error)); }
}).listen(port, () => console.log(`Pré-visualização em http://localhost:${port}`));
