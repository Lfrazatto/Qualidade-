// Os arquivos de interface são ativos privados no R2, servidos por este Worker.

const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; media-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};
const PRIVATE_CACHE = { 'Cache-Control': 'no-store, max-age=0' };
const ADMIN_TABLES = {
  sources: { pk: 'id', fields: ['title','publisher','url','published_at','accessed_at','summary','license'] },
  content_pages: { pk: 'id', fields: ['slug','title','kicker','body_markdown','status'] },
  timeline_events: { pk: 'id', fields: ['subject','date_label','sort_order','title','body','source_id','status'] },
  truck_models: { pk: 'id', fields: ['brand','model','version','year','region','category','summary','image_key','source_id','status'] },
  model_specs: { pk: 'id', fields: ['model_id','label','value','unit','conditions','source_id','status'] },
  truck_hotspots: { pk: 'id', fields: ['model_id','slug','label','x_pct','y_pct','explanation','source_id','sort_order','active'] },
  media_assets: { pk: 'id', fields: ['key','alt_text','caption','license','attribution','source_url','mime_type'] },
  games: { pk: 'id', fields: ['slug','title','description','game_type','config_json','is_enabled','sort_order'] },
  quiz_questions: { pk: 'id', fields: ['prompt','options_json','correct_option','explanation','active','source_id'] },
  events: { pk: 'id', fields: ['slug','title','description','starts_at','ends_at','accept_scores','show_leaderboard','active'] },
  participants: { pk: 'id', fields: ['event_id','pseudonym','consent_at','consent_version'] },
  scores: { pk: 'id', fields: ['event_id','participant_id','game_id','points'] },
  site_settings: { pk: 'key', fields: ['value'] },
  audit_log: { pk: 'id', fields: [], readOnly: true },
};

function response(body, status = 200, headers = {}) {
  const merged = new Headers(SECURITY);
  for (const [key, value] of Object.entries(headers)) merged.set(key, value);
  return new Response(body, { status, headers: merged });
}
function json(data, status = 200, headers = {}) {
  return response(JSON.stringify(data), status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...PRIVATE_CACHE,
    ...headers,
  });
}
function html(body, status = 200) {
  return response(body, status, { 'Content-Type': 'text/html; charset=utf-8', ...PRIVATE_CACHE });
}
async function staticAsset(env, key, contentType, cacheControl = 'public, max-age=300') {
  const object = await env.MEDIA.get(key);
  if (!object) return response('Not found',404,PRIVATE_CACHE);
  const headers = new Headers(SECURITY);
  object.writeHttpMetadata(headers);
  headers.set('Content-Type',contentType);
  headers.set('Cache-Control',cacheControl);
  return new Response(object.body,{headers});
}
async function readJson(request, max = 100_000) {
  const raw = await request.text();
  if (raw.length > max) throw new Error('Payload excede o tamanho permitido.');
  return JSON.parse(raw || '{}');
}
function uuid() { return crypto.randomUUID(); }
function cleanText(value, max = 12_000) {
  return String(value ?? '').trim().slice(0, max);
}
function safeUrl(value, required = false) {
  const v = cleanText(value, 2000);
  if (!v && !required) return '';
  const u = new URL(v);
  if (u.protocol !== 'https:') throw new Error('A URL deve usar HTTPS.');
  return u.toString();
}
async function selectedImageMetadata(env, value) {
  const key = cleanText(value,200);
  if (!/^media\/[a-z0-9._-]+\.(?:jpe?g|png|webp|svg)$/i.test(key) || key.includes('..')) return null;
  const asset = await env.DB.prepare('SELECT key,alt_text,caption,license,attribution,source_url FROM media_assets WHERE key=? LIMIT 1').bind(key).first();
  if (!asset?.alt_text || !asset.attribution || !asset.license || !await env.MEDIA.head(key)) return null;
  return asset;
}
// Vídeo de destaque opcional: só é exposto se houver arquivo no R2 e metadados completos (alt, atribuição, licença).
async function selectedVideoMetadata(env, value) {
  const key = cleanText(value,200);
  if (!/^media\/[a-z0-9._-]+\.(?:mp4|webm)$/i.test(key) || key.includes('..')) return null;
  const asset = await env.DB.prepare('SELECT key,alt_text,caption,license,attribution,source_url,mime_type FROM media_assets WHERE key=? LIMIT 1').bind(key).first();
  if (!asset?.alt_text || !asset.attribution || !asset.license || !await env.MEDIA.head(key)) return null;
  return asset;
}
async function recordAudit(env, actor, action, table, id, summary) {
  await env.DB.prepare('INSERT INTO audit_log (id, actor_email, action, target_type, target_id, summary) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(uuid(), actor, action, table, String(id), cleanText(summary, 500)).run();
}
let cachedAccessKeys = null;
let cachedAccessKeysAt = 0;
function accessB64Url(value) {
  const normalized = value.replace(/-/g,'+').replace(/_/g,'/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary,(character) => character.charCodeAt(0));
}
function accessJsonSegment(value) {
  return JSON.parse(new TextDecoder().decode(accessB64Url(value)));
}
function accessAudienceMatches(value, expected) {
  return (Array.isArray(value) ? value : [value]).includes(expected);
}
async function accessJwks(env, refresh = false) {
  if (!refresh && cachedAccessKeys && Date.now() - cachedAccessKeysAt < 3_600_000) return cachedAccessKeys;
  const team = String(env.ACCESS_TEAM_DOMAIN || '').replace(/\/+$/,'');
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/i.test(team)) return [];
  const response = await fetch(`${team}/cdn-cgi/access/certs`,{headers:{Accept:'application/json'}});
  if (!response.ok) return [];
  const data = await response.json();
  cachedAccessKeys = Array.isArray(data.keys) ? data.keys : [];
  cachedAccessKeysAt = Date.now();
  return cachedAccessKeys;
}
async function verifyAccessJwt(request, env) {
  const token = request.headers.get('cf-access-jwt-assertion') || '';
  const parts = token.split('.');
  const team = String(env.ACCESS_TEAM_DOMAIN || '').replace(/\/+$/,'');
  const expectedAudience = String(env.ACCESS_APP_AUD || '');
  if (parts.length !== 3 || !expectedAudience) return null;
  try {
    const header = accessJsonSegment(parts[0]);
    const claims = accessJsonSegment(parts[1]);
    const now = Math.floor(Date.now()/1000);
    if (header.alg !== 'RS256' || !header.kid || claims.iss !== team || !accessAudienceMatches(claims.aud,expectedAudience) || !Number.isFinite(Number(claims.exp)) || Number(claims.exp) <= now || (Number(claims.nbf || 0) > now + 30)) return null;
    let keys = await accessJwks(env);
    let jwk = keys.find((key) => key.kid === header.kid);
    if (!jwk) { keys = await accessJwks(env,true); jwk = keys.find((key) => key.kid === header.kid); }
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    const verified = await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,accessB64Url(parts[2]),new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    if (!verified || !claims.email) return null;
    return { email: claims.email, name: claims.name || '' };
  } catch {
    return null;
  }
}
async function adminIdentity(request, ctx, env) {
  const allowedEmail = String(env.ADMIN_EMAIL || '').toLowerCase();
  if (!allowedEmail) return null;
  if (ctx?.access) {
    try {
      const identity = await ctx.access.getIdentity();
      if (!identity?.email || identity.email.toLowerCase() !== allowedEmail) return null;
      if (ctx.access.aud && env.ACCESS_APP_AUD && !accessAudienceMatches(ctx.access.aud,env.ACCESS_APP_AUD)) return null;
      return identity;
    } catch {}
  }
  const identity = await verifyAccessJwt(request,env);
  if (!identity?.email || identity.email.toLowerCase() !== allowedEmail) return null;
  return identity;
}

async function publicSite(env) {
  const now = new Date().toISOString();
  const [pages, timeline, models, specs, hotspots, sources, games, events, quizSetting, imageSetting, explorerImageSetting, videoSetting, posterSetting] = await Promise.all([
    env.DB.prepare("SELECT slug,title,kicker,body_markdown FROM content_pages WHERE status='published' ORDER BY slug LIMIT 50").all(),
    env.DB.prepare("SELECT t.id,t.subject,t.date_label,t.sort_order,t.title,t.body,s.title AS source_title,s.url AS source_url FROM timeline_events t LEFT JOIN sources s ON s.id=t.source_id WHERE t.status='published' ORDER BY t.sort_order,t.date_label LIMIT 100").all(),
    env.DB.prepare("SELECT m.id,m.brand,m.model,m.version,m.year,m.region,m.category,m.summary,m.image_key,a.alt_text AS image_alt_text,a.caption AS image_caption,a.license AS image_license,a.attribution AS image_attribution,a.source_url AS image_source_url,s.url AS source_url,s.title AS source_title FROM truck_models m LEFT JOIN sources s ON s.id=m.source_id LEFT JOIN media_assets a ON a.key=m.image_key WHERE m.status='published' ORDER BY m.model LIMIT 50").all(),
    env.DB.prepare("SELECT id,model_id,label,value,unit,conditions,source_id FROM model_specs WHERE status='published' ORDER BY label LIMIT 200").all(),
    env.DB.prepare("SELECT id,model_id,slug,label,x_pct,y_pct,explanation,source_id,sort_order FROM truck_hotspots WHERE active=1 ORDER BY sort_order LIMIT 50").all(),
    env.DB.prepare('SELECT id,title,publisher,url,published_at,accessed_at,summary,license FROM sources ORDER BY publisher,title LIMIT 100').all(),
    env.DB.prepare('SELECT slug,title,description,game_type,config_json FROM games WHERE is_enabled=1 ORDER BY sort_order LIMIT 20').all(),
    env.DB.prepare('SELECT id,slug,title,description,starts_at,ends_at,accept_scores,show_leaderboard FROM events WHERE active=1 AND ends_at >= ? ORDER BY starts_at LIMIT 10').bind(now).all(),
    env.DB.prepare("SELECT value FROM site_settings WHERE key='quiz_enabled' LIMIT 1").first(),
    env.DB.prepare("SELECT value FROM site_settings WHERE key='hero_image_key' LIMIT 1").first(),
    env.DB.prepare("SELECT value FROM site_settings WHERE key='explorer_image_key' LIMIT 1").first(),
    env.DB.prepare("SELECT value FROM site_settings WHERE key='hero_video_key' LIMIT 1").first(),
    env.DB.prepare("SELECT value FROM site_settings WHERE key='hero_video_poster_key' LIMIT 1").first(),
  ]);
  const [heroImage, explorerImage, heroVideo, heroVideoPoster] = await Promise.all([
    selectedImageMetadata(env,imageSetting?.value),
    selectedImageMetadata(env,explorerImageSetting?.value),
    selectedVideoMetadata(env,videoSetting?.value),
    selectedImageMetadata(env,posterSetting?.value),
  ]);
  const quizRequested = ['true','1'].includes(String(quizSetting?.value || '').toLowerCase());
  let quizQuestions = [];
  if (quizRequested) {
    const result = await env.DB.prepare("SELECT q.id,q.prompt,q.options_json,s.title AS source_title,s.url AS source_url FROM quiz_questions q LEFT JOIN sources s ON s.id=q.source_id WHERE q.active=1 ORDER BY q.rowid LIMIT 20").all();
    quizQuestions = (result.results || []).filter((question) => {
      try { const options = JSON.parse(question.options_json); return Boolean(question.prompt) && Array.isArray(options) && options.length >= 2 && options.length <= 8 && options.every((option) => typeof option === 'string' && option.trim()); }
      catch { return false; }
    });
  }
  return {
    pages: pages.results || [], timeline: timeline.results || [], models: models.results || [],
    specs: specs.results || [], hotspots: hotspots.results || [], sources: sources.results || [],
    games: games.results || [], events: events.results || [], quizQuestions, heroImage, explorerImage, heroVideo, heroVideoPoster,
    settings: { quizEnabled: quizRequested && quizQuestions.length > 0, scoresEnabled: (events.results || []).some((event) => event.accept_scores === 1), heroImageKey: heroImage?.key || '', explorerImageKey: explorerImage?.key || '', heroVideoKey: heroVideo?.key || '' },
  };
}

async function publicApi(request, url, env) {
  if (request.method === 'GET' && url.pathname === '/api/public/site') {
    return json(await publicSite(env));
  }
  if (request.method === 'POST' && url.pathname === '/api/public/quiz/answer') {
    let body;
    try { body = await readJson(request, 4096); } catch { return json({ error: 'Envie uma resposta válida.' },400); }
    const questionId = cleanText(body.question_id,80); const answerIndex = Number(body.answer_index);
    if (!questionId || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 7) return json({ error: 'Selecione uma alternativa válida.' },400);
    const setting = await env.DB.prepare("SELECT value FROM site_settings WHERE key='quiz_enabled' LIMIT 1").first();
    if (!['true','1'].includes(String(setting?.value || '').toLowerCase())) return json({ error: 'O quiz está desativado.' },409);
    const question = await env.DB.prepare("SELECT q.correct_option,q.explanation,q.options_json,s.title AS source_title,s.url AS source_url FROM quiz_questions q LEFT JOIN sources s ON s.id=q.source_id WHERE q.id=? AND q.active=1 LIMIT 1").bind(questionId).first();
    if (!question) return json({ error: 'A pergunta não está publicada.' },404);
    let options;
    try { options = JSON.parse(question.options_json); } catch { return json({ error: 'A pergunta está configurada incorretamente.' },409); }
    if (!Array.isArray(options) || answerIndex >= options.length || !Number.isInteger(Number(question.correct_option)) || Number(question.correct_option) < 0 || Number(question.correct_option) >= options.length) return json({ error: 'A pergunta está configurada incorretamente.' },409);
    return json({ correct: answerIndex === Number(question.correct_option), explanation: question.explanation || '', source_title: question.source_title || '', source_url: question.source_url || '' });
  }
  if (request.method === 'GET' && url.pathname === '/api/public/leaderboard') {
    const slug = cleanText(url.searchParams.get('event'), 80);
    const event = await env.DB.prepare('SELECT id,show_leaderboard,active,starts_at,ends_at FROM events WHERE slug=? LIMIT 1').bind(slug).first();
    const now = new Date().toISOString();
    if (!event || event.active !== 1 || event.show_leaderboard !== 1 || now < event.starts_at || now > event.ends_at) return json({ enabled: false, scores: [] });
    const scores = await env.DB.prepare('SELECT p.pseudonym,s.points,s.created_at FROM scores s JOIN participants p ON p.id=s.participant_id WHERE s.event_id=? ORDER BY s.points DESC,s.created_at ASC LIMIT 20').bind(event.id).all();
    return json({ enabled: true, scores: scores.results || [] });
  }
  if (request.method === 'POST' && url.pathname === '/api/public/scores') {
    let body;
    try { body = await readJson(request, 4096); } catch { return json({ error: 'Envie uma solicitação válida.' }, 400); }
    const pseudonym = cleanText(body.pseudonym, 30).replace(/\s+/g, ' ');
    if (!body.consent || !/^[-_ \p{L}\p{N}]{2,24}$/u.test(pseudonym)) return json({ error: 'Informe um pseudônimo de 2 a 24 caracteres e aceite o aviso de privacidade.' }, 400);
    const mission = Number(body.mission);
    const resources = Number(body.resources);
    if (![1,2,3].includes(mission) || !Number.isInteger(resources) || resources < 20 || resources > 100 || resources % 10 !== 0) return json({ error: 'As escolhas da simulação são inválidas.' }, 400);
    const target = mission === 1 ? 45 : mission === 2 ? 60 : 80;
    const goal = Math.max(35,Math.min(95,Math.round((mission === 1 ? 82 : mission === 2 ? 70 : 92) - Math.abs(resources - target) * .25)));
    const points = Math.max(40,Math.min(96,Math.round(resources * .52 + goal * .48)));
    const event = await env.DB.prepare('SELECT * FROM events WHERE slug=? AND active=1 AND accept_scores=1 LIMIT 1').bind(cleanText(body.event, 80)).first();
    const now = new Date().toISOString();
    if (!event || now < event.starts_at || now > event.ends_at) return json({ error: 'Este evento não está recebendo pontuações.' }, 409);
    const game = await env.DB.prepare('SELECT id FROM games WHERE slug=? AND is_enabled=1 LIMIT 1').bind(cleanText(body.game, 80)).first();
    if (!game) return json({ error: 'Esta atividade não está habilitada.' }, 409);
    const participantId = uuid();
    const scoreId = uuid();
    try {
      const consentVersion = await env.DB.prepare("SELECT value FROM site_settings WHERE key='privacy_consent_version' LIMIT 1").first();
      await env.DB.batch([
        env.DB.prepare('INSERT INTO participants (id,event_id,pseudonym,consent_at,consent_version) VALUES (?,?,?,?,?)').bind(participantId,event.id,pseudonym,now,consentVersion?.value || '1'),
        env.DB.prepare('INSERT INTO scores (id,event_id,participant_id,game_id,points) VALUES (?,?,?,?,?)').bind(scoreId,event.id,participantId,game.id,points),
      ]);
    } catch (error) {
      if (String(error).toLowerCase().includes('unique')) return json({ error: 'Este pseudônimo já participou deste evento.' }, 409);
      return json({ error: 'Não foi possível salvar a pontuação agora.' }, 500);
    }
    return json({ saved: true, pseudonym, points }, 201);
  }
  return json({ error: 'Rota não encontrada.' }, 404);
}

async function adminApi(request, url, env, identity) {
  const path = url.pathname;
  if (request.method === 'GET' && path === '/admin/api/collections') {
    const table = url.searchParams.get('table');
    const config = ADMIN_TABLES[table];
    if (!config) return json({ error: 'Coleção desconhecida.' }, 404);
    const result = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY rowid DESC LIMIT 200`).all();
    return json({ table, readOnly: Boolean(config.readOnly), columns: [config.pk, ...config.fields], rows: result.results || [] });
  }
  if (request.method === 'POST' && path === '/admin/api/upload') {
    let form;
    try { form = await request.formData(); } catch { return json({ error: 'Formulário de arquivo inválido.' }, 400); }
    const file = form.get('file');
    const isVideo = file instanceof File && ['video/mp4','video/webm'].includes(file.type);
    if (!(file instanceof File) || (!isVideo && !['image/jpeg','image/png','image/webp'].includes(file.type)) || file.size > (isVideo ? 25_000_000 : 5_000_000)) {
      return json({ error: 'Envie JPEG, PNG ou WebP de até 5 MB, ou vídeo MP4/WebM de até 25 MB.' }, 400);
    }
    const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
    const key = `media/${uuid()}.${ext}`;
    const metadata = {
      id: uuid(), key,
      alt_text: cleanText(form.get('alt_text'), 250),
      caption: cleanText(form.get('caption'), 500),
      license: cleanText(form.get('license'), 120),
      attribution: cleanText(form.get('attribution'), 500),
      source_url: '',
      mime_type: file.type,
    };
    if (!metadata.alt_text || !metadata.attribution || !metadata.license) return json({ error: 'Texto alternativo, atribuição e licença são obrigatórios. Para arte própria, informe o responsável e “Arte própria”.' },400);
    try { metadata.source_url = safeUrl(form.get('source_url') || ''); }
    catch { return json({ error: 'A URL original deve usar HTTPS.' },400); }
    try {
      await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' } });
      await env.DB.prepare('INSERT INTO media_assets (id,key,alt_text,caption,license,attribution,source_url,mime_type) VALUES (?,?,?,?,?,?,?,?)')
        .bind(metadata.id,metadata.key,metadata.alt_text,metadata.caption,metadata.license,metadata.attribution,metadata.source_url,metadata.mime_type).run();
    } catch {
      await env.MEDIA.delete(key);
      return json({ error: 'Não foi possível salvar a mídia e seus créditos.' },500);
    }
    await recordAudit(env, identity.email, 'upload', 'media_assets', metadata.id, key);
    return json({ ...metadata, url: `/${key}` }, 201);
  }
  const match = path.match(/^\/admin\/api\/collections\/([a-z_]+)(?:\/([^/]+))?$/);
  if (!match) return json({ error: 'Rota administrativa não encontrada.' }, 404);
  const table = match[1];
  const id = match[2] ? decodeURIComponent(match[2]) : null;
  const config = ADMIN_TABLES[table];
  if (!config) return json({ error: 'Coleção não permitida.' }, 404);
  if (config.readOnly && request.method !== 'GET') return json({ error: 'Esta coleção é somente leitura.' }, 405);
  if (request.method === 'POST' && !id) {
    let body;
    try { body = await readJson(request); } catch { return json({ error: 'JSON inválido.' }, 400); }
    const allowed = config.fields.filter((field) => Object.hasOwn(body, field));
    if (table === 'site_settings' && !cleanText(body.key,100)) return json({ error: 'A chave é obrigatória.' },400);
    if (table === 'site_settings' && cleanText(body.key,100) === 'hero_image_key' && !await selectedImageMetadata(env,body.value)) return json({ error: 'Selecione uma mídia com arquivo R2, texto alternativo, atribuição e licença.' },400);
    if (table === 'site_settings' && cleanText(body.key,100) === 'hero_video_key' && !await selectedVideoMetadata(env,body.value)) return json({ error: 'Selecione um vídeo MP4/WebM com arquivo R2, texto alternativo, atribuição e licença.' },400);
    if (table === 'site_settings' && cleanText(body.key,100) === 'hero_video_poster_key' && !await selectedImageMetadata(env,body.value)) return json({ error: 'A capa do vídeo deve ser uma imagem com arquivo R2, texto alternativo, atribuição e licença.' },400);
    if (table === 'sources' && body.url) { try { body.url = safeUrl(body.url, true); } catch (e) { return json({error:e.message},400); } }
    if (table === 'media_assets' && body.source_url) { try { body.source_url = safeUrl(body.source_url); } catch (e) { return json({error:e.message},400); } }
    for (const field of ['config_json','options_json']) if (body[field]) { try { JSON.parse(body[field]); } catch { return json({error:`${field} deve conter JSON válido.`},400); } }
    const pk = config.pk;
    const pkValue = table === 'site_settings' ? cleanText(body.key,100) : uuid();
    const columns = [pk, ...allowed];
    const values = [pkValue, ...allowed.map((field) => body[field])];
    const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`;
    try { await env.DB.prepare(sql).bind(...values).run(); }
    catch { return json({ error: 'Não foi possível criar o registro. Confira campos obrigatórios e relações.' }, 400); }
    await recordAudit(env,identity.email,'create',table,pkValue,'Registro criado');
    return json({ id: pkValue, key: pkValue },201);
  }
  if (request.method === 'PUT' && id) {
    let body;
    try { body = await readJson(request); } catch { return json({ error: 'JSON inválido.' }, 400); }
    const fields = config.fields.filter((field) => Object.hasOwn(body, field) && !(table === 'media_assets' && field === 'key'));
    if (!fields.length) return json({ error: 'Nenhum campo permitido foi informado.' },400);
    if (table === 'site_settings' && id === 'hero_image_key' && Object.hasOwn(body,'value') && !await selectedImageMetadata(env,body.value)) return json({ error: 'Selecione uma mídia com arquivo R2, texto alternativo, atribuição e licença.' },400);
    if (table === 'site_settings' && id === 'hero_video_key' && Object.hasOwn(body,'value') && !await selectedVideoMetadata(env,body.value)) return json({ error: 'Selecione um vídeo MP4/WebM com arquivo R2, texto alternativo, atribuição e licença.' },400);
    if (table === 'site_settings' && id === 'hero_video_poster_key' && Object.hasOwn(body,'value') && !await selectedImageMetadata(env,body.value)) return json({ error: 'A capa do vídeo deve ser uma imagem com arquivo R2, texto alternativo, atribuição e licença.' },400);
    if (table === 'sources' && body.url) { try { body.url = safeUrl(body.url, true); } catch (e) { return json({error:e.message},400); } }
    if (table === 'media_assets' && body.source_url) { try { body.source_url = safeUrl(body.source_url); } catch (e) { return json({error:e.message},400); } }
    for (const field of ['config_json','options_json']) if (body[field]) { try { JSON.parse(body[field]); } catch { return json({error:`${field} deve conter JSON válido.`},400); } }
    const clauses = fields.map((field) => `${field}=?`);
    if (table === 'content_pages') clauses.push("updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')");
    if (table === 'site_settings') clauses.push("updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')");
    const result = await env.DB.prepare(`UPDATE ${table} SET ${clauses.join(',')} WHERE ${config.pk}=?`)
      .bind(...fields.map((field) => body[field]),id).run();
    if (!result.meta?.changes) return json({ error: 'Registro não encontrado.' },404);
    await recordAudit(env,identity.email,'update',table,id,`Campos: ${fields.join(', ')}`);
    return json({ updated: true });
  }
  if (request.method === 'DELETE' && id) {
    if (table === 'media_assets') {
      const row = await env.DB.prepare('SELECT key FROM media_assets WHERE id=?').bind(id).first();
      if (row?.key) {
        const selected = await env.DB.prepare("SELECT value FROM site_settings WHERE key='hero_image_key' LIMIT 1").first();
        if (selected?.value === row.key) return json({ error: 'Escolha outra imagem principal antes de excluir este arquivo.' },409);
        const selectedMedia = await env.DB.prepare("SELECT key FROM site_settings WHERE key IN ('hero_video_key','hero_video_poster_key') AND value=? LIMIT 1").bind(row.key).first();
        if (selectedMedia) return json({ error: 'Remova a configuração do vídeo de abertura antes de excluir este arquivo.' },409);
        await env.MEDIA.delete(row.key);
      }
    }
    const result = await env.DB.prepare(`DELETE FROM ${table} WHERE ${config.pk}=?`).bind(id).run();
    if (!result.meta?.changes) return json({ error: 'Registro não encontrado.' },404);
    await recordAudit(env,identity.email,'delete',table,id,'Registro removido');
    return json({ deleted: true });
  }
  return json({ error: 'Método não permitido.' },405,{ Allow: 'GET, POST, PUT, DELETE' });
}

async function fetchMedia(request, path, env) {
  const key = decodeURIComponent(path.slice(1));
  if (!key.startsWith('media/') || key.includes('..')) return response('Not found',404);
  const wantsRange = request.headers.has('range');
  const object = await env.MEDIA.get(key, wantsRange ? { range: request.headers } : undefined);
  if (!object) return response('Not found',404);
  const headers = new Headers(SECURITY);
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);
  headers.set('Accept-Ranges','bytes');
  headers.set('Cache-Control','public, max-age=31536000, immutable');
  let status = 200;
  if (wantsRange && object.range) {
    const size = object.size;
    const offset = object.range.offset ?? Math.max(0, size - object.range.length);
    const length = object.range.length ?? size - offset;
    headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${size}`);
    headers.set('Content-Length', String(length));
    status = 206;
  }
  return new Response(request.method === 'HEAD' ? null : object.body,{ status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isAdminHost = url.hostname === 'iveco-cummins-performance-admin.lmpfrazatto.workers.dev';
    if (isAdminHost) {
      const identity = await adminIdentity(request,ctx,env);
      if (!identity) return json({error:'Acesso administrativo negado.'},403,PRIVATE_CACHE);
      if (url.pathname === '/' || url.pathname === '/admin' || url.pathname === '/admin/') return staticAsset(env,'site/admin.html','text/html; charset=utf-8','no-store, max-age=0');
      if (url.pathname === '/admin/admin.css') return staticAsset(env,'site/admin.css','text/css; charset=utf-8','no-store, max-age=0');
      if (url.pathname === '/admin/admin.js') return staticAsset(env,'site/admin.js','text/javascript; charset=utf-8','no-store, max-age=0');
      if (url.pathname.startsWith('/admin/api/')) return adminApi(request,url,env,identity);
      if (url.pathname.startsWith('/media/')) return fetchMedia(request,url.pathname,env);
      return response('Not found',404,PRIVATE_CACHE);
    }
    if (url.pathname.startsWith('/admin')) {
      return Response.redirect('https://iveco-cummins-performance-admin.lmpfrazatto.workers.dev/admin',302);
    }
    if (url.pathname.startsWith('/api/public/')) return publicApi(request,url,env);
    if (url.pathname.startsWith('/media/')) return fetchMedia(request,url.pathname,env);
    if (request.method !== 'GET' && request.method !== 'HEAD') return response('Method not allowed',405,{Allow:'GET, HEAD'});
    const font = url.pathname.match(/^\/fonts\/((?:inter|inter-display|mono)-[0-9]{3}\.woff)$/);
    if (font) return staticAsset(env,`site/fonts/${font[1]}`,'font/woff','public, max-age=31536000, immutable');
    if (url.pathname === '/styles.css') return staticAsset(env,'site/styles.css','text/css; charset=utf-8');
    if (url.pathname === '/app.js') return staticAsset(env,'site/app.js','text/javascript; charset=utf-8');
    if (url.pathname === '/manus-routes.json') return staticAsset(env,'site/manus-routes.json','application/json; charset=utf-8','public, max-age=300');
    if (url.pathname === '/robots.txt') return response('User-agent: *\nDisallow: /admin\n',200,{'Content-Type':'text/plain; charset=utf-8'});
    const publicPages = {
      '/':'site/index.html',
      '/historia':'site/pages/historia.html',
      '/qualidade':'site/pages/qualidade.html',
      '/pecas':'site/pages/pecas.html',
      '/desempenho':'site/pages/desempenho.html',
      '/modelos':'site/pages/modelos.html',
      '/experiencia':'site/pages/experiencia.html',
      '/fontes':'site/pages/fontes.html',
    };
    const route = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '');
    const asset = publicPages[route];
    if (!asset) return response('Página não encontrada.',404,PRIVATE_CACHE);
    return staticAsset(env,asset,'text/html; charset=utf-8','public, max-age=300');
  },
};
