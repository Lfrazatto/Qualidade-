const state = {
  data: null,
  filterTimeline: 'all',
  activeTimelineId: null,
  filterModels: 'all',
  activeModelIndex: 0,
  activeVariants: {},
  activeHotspot: null,
  quizIndex: 0,
  quizStarted: false,
  quizCorrect: 0,
  quizAnswered: new Set(),
  quizFinished: false,
};
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
const safeLink = (url) => { try { const parsed = new URL(url, location.origin); return parsed.protocol === 'https:' ? parsed.href : '#'; } catch { return '#'; } };
const safeMediaPath = (key) => /^media\/[a-z0-9._-]+\.(?:jpe?g|png|webp|svg)$/i.test(String(key || '')) && !String(key).includes('..');
const safeVideoPath = (key) => /^media\/[a-z0-9._-]+\.(?:mp4|webm)$/i.test(String(key || '')) && !String(key).includes('..');
const labelSubject = (subject) => ({ iveco:'IVECO', cummins:'Cummins', meritor:'Cummins / Meritor', connection:'Conexão histórica' }[subject] || 'História');
const prefersReducedMotion = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
const motionOn = () => !prefersReducedMotion() && document.documentElement.dataset.motion !== 'off';
const scrollBehavior = () => (motionOn() ? 'smooth' : 'auto');
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* armazenamento indisponível */ } },
};
const photoSrcsets = {
  'media/sway-hero.webp': ['640', '1280', '1920', '2560'],
  'media/daily-archive.webp': ['480', '960', '1600'],
  'media/tector-fenatran.webp': ['480', '960', '1280'],
  'media/tector-profile.webp': ['480', '960'],
};
let toastTimer;
function toast(message) {
  const node = $('#toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-visible'), 3200);
}
function sourceFor(id) { return state.data?.sources?.find((source) => String(source.id) === String(id)); }
function sourceLink(url, label = 'Abrir fonte original') {
  const safe = safeLink(url);
  if (safe === '#') return '';
  return `<a class="source-link" href="${escapeHTML(safe)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} <span aria-hidden="true">↗</span></a>`;
}
function mediaSrcset(key) {
  const name = String(key || '').split('/').pop();
  const base = name?.replace(/\.webp$/i, '');
  const widths = photoSrcsets[key];
  return widths?.map((width) => `/media/${base}-${width}.webp ${width}w`).join(', ') || '';
}
function renderMarkdown(value) {
  return String(value || '').trim().split(/\n{2,}/).filter(Boolean).map((block) => {
    const lines = block.split('\n');
    if (lines.every((line) => /^[-*] /.test(line))) return `<ul>${lines.map((line) => `<li>${escapeHTML(line.slice(2))}</li>`).join('')}</ul>`;
    const heading = block.match(/^#{1,3}\s+(.+)$/);
    if (heading) return `<h3>${escapeHTML(heading[1])}</h3>`;
    return `<p>${escapeHTML(block).replace(/\n/g, '<br>')}</p>`;
  }).join('');
}
/* Cada módulo registra uma função; o arranque (99-init.js) chama-as na ordem. */
const initializers = [];
const dataRenderers = [];
const onInit = (fn) => initializers.push(fn);
const onData = (fn) => dataRenderers.push(fn);
