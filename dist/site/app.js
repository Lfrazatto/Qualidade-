(() => {
'use strict';
/* 00-core.js */
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

/* 10-shell.js */
const scrollTasks = [];
const onScroll = (fn) => scrollTasks.push(fn);

function setupNavigation() {
  const toggle = $('.menu-toggle'); const nav = $('#site-nav'); const header = $('.site-header');
  if (!nav) return;
  const currentPath = location.pathname.replace(/\/+$/, '') || '/';
  const currentRoute = currentPath === '/' ? 'home' : currentPath.slice(1);
  $$('li', nav).forEach((item, index) => item.style.setProperty('--i', String(index)));
  const links = $$('[data-route-link]', nav);
  links.forEach((link) => {
    if (link.dataset.routeLink === currentRoute) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  /* Indicador animado: acompanha o hover/foco e retorna à página atual */
  const place = (link) => {
    if (!link || getComputedStyle(nav).position === 'fixed') return;
    const padding = parseFloat(getComputedStyle(link).paddingLeft) || 0;
    nav.style.setProperty('--ind-x', `${link.offsetLeft + padding}px`);
    nav.style.setProperty('--ind-w', String((link.offsetWidth - padding * 2) / 100));
    nav.style.setProperty('--ind-o', '1');
  };
  const current = () => links.find((link) => link.getAttribute('aria-current') === 'page');
  const reset = () => { const link = current(); if (link) place(link); else nav.style.setProperty('--ind-o', '0'); };
  links.forEach((link) => {
    link.addEventListener('pointerenter', () => place(link));
    link.addEventListener('focus', () => place(link));
    link.addEventListener('blur', reset);
  });
  nav.addEventListener('pointerleave', reset);
  reset();
  window.addEventListener('resize', reset, { passive: true });
  document.fonts?.ready.then(reset);

  const setMenu = (open) => {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar navegação' : 'Abrir navegação');
    nav.classList.toggle('is-open', open);
    header?.classList.toggle('menu-open', open);
    document.body.classList.toggle('menu-locked', open);
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  links.forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle?.focus(); } });
  window.addEventListener('resize', () => { if (window.innerWidth >= 1200 && nav.classList.contains('is-open')) setMenu(false); }, { passive: true });
  window.addEventListener('pageshow', () => setMenu(false));
}

function setupScrollFeedback() {
  const header = $('.site-header'); const bar = $('#scroll-progress-bar');
  let scheduled = false;
  const update = () => {
    scheduled = false;
    const top = window.scrollY || document.documentElement.scrollTop;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (bar) bar.style.transform = `scaleX(${Math.max(0, Math.min(1, top / max))})`;
    header?.classList.toggle('is-scrolled', top > 18);
    for (const task of scrollTasks) task(top);
  };
  const request = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  update();
}

function setupMotionToggle() {
  const buttons = $$('[data-motion-toggle]');
  const sync = () => {
    const system = prefersReducedMotion();
    const paused = system || document.documentElement.dataset.motion === 'off';
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(paused));
      button.disabled = system;
      button.textContent = system ? 'Movimento reduzido pelo sistema' : paused ? 'Retomar movimento' : 'Pausar movimento';
    });
    document.dispatchEvent(new CustomEvent('rv:motion', { detail: { on: !paused } }));
  };
  if (store.get('rv-motion') === 'off') document.documentElement.dataset.motion = 'off';
  buttons.forEach((button) => button.addEventListener('click', () => {
    const off = document.documentElement.dataset.motion !== 'off';
    if (off) document.documentElement.dataset.motion = 'off'; else delete document.documentElement.dataset.motion;
    store.set('rv-motion', off ? 'off' : 'on');
    sync();
  }));
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change', sync);
  sync();
}
onInit(setupNavigation);
onInit(setupMotionToggle);
onInit(setupScrollFeedback);

/* 20-motion.js */
function revealAll() { $$('[data-reveal]').forEach((node) => node.classList.add('is-visible')); $$('[data-draw]').forEach((node) => node.classList.add('is-visible')); }
function setupReveal() {
  $$('[data-stagger]').forEach((group) => {
    [...group.children].forEach((child, index) => {
      if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', group.dataset.stagger || 'rise');
      child.style.setProperty('--i', String(Math.min(index, 7)));
    });
  });
  const targets = $$('[data-reveal],[data-draw]');
  if (!motionOn() || !('IntersectionObserver' in window)) { revealAll(); return; }
  /* O que já está na primeira tela não é escondido: evita piscar antes do JS carregar. */
  const vh = window.innerHeight;
  targets.forEach((node) => { if (node.getBoundingClientRect().top < vh * 0.92) node.classList.add('is-visible'); });
  document.documentElement.classList.add('has-motion');
  document.body.classList.add('has-motion');
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  targets.forEach((node) => { if (!node.classList.contains('is-visible')) observer.observe(node); });
  document.addEventListener('rv:motion', (event) => { if (!event.detail.on) revealAll(); });
}

function formatCount(value) { return Math.round(value).toLocaleString('pt-BR'); }
function animateCount(node, target) {
  if (!motionOn()) { node.textContent = formatCount(target); return; }
  const start = performance.now(); const duration = 1300;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    node.textContent = formatCount(target * (1 - Math.pow(1 - t, 4)));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function setupCounters() {
  const nodes = $$('[data-count]');
  if (!nodes.length) return;
  const run = (node) => { if (!node.dataset.counted) { node.dataset.counted = '1'; animateCount(node, Number(node.dataset.count) || 0); } };
  if (!('IntersectionObserver' in window)) { nodes.forEach(run); return; }
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { run(entry.target); observer.unobserve(entry.target); } }), { threshold: 0.6 });
  nodes.forEach((node) => { node.textContent = formatCount(0); observer.observe(node); });
}

/* Texto que se acende palavra a palavra com a rolagem */
function setupFillText() {
  const blocks = $$('[data-fill]');
  if (!blocks.length) return;
  const prepared = blocks.map((block) => {
    const words = block.textContent.trim().split(/\s+/);
    block.textContent = '';
    block.classList.add('fill-text');
    const spans = words.map((word, index) => { const span = document.createElement('span'); span.className = 'fw'; span.textContent = word; block.append(span); if (index < words.length - 1) block.append(' '); return span; });
    return { block, spans };
  });
  const update = () => {
    const vh = window.innerHeight;
    for (const { block, spans } of prepared) {
      if (!motionOn()) { spans.forEach((span) => span.classList.add('is-lit')); continue; }
      const rect = block.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (vh * 0.82 - rect.top) / (rect.height + vh * 0.3)));
      const lit = Math.round(progress * spans.length);
      spans.forEach((span, index) => span.classList.toggle('is-lit', index < lit));
    }
  };
  onScroll(update);
  document.addEventListener('rv:motion', update);
  update();
}

/* Profundidade discreta em imagens */
function setupParallax() {
  const nodes = $$('[data-parallax]');
  if (!nodes.length) return;
  const update = () => {
    const vh = window.innerHeight;
    for (const node of nodes) {
      if (!motionOn() || window.innerWidth < 760) { node.style.transform = ''; continue; }
      const rect = node.parentElement.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > vh + 100) continue;
      const offset = (rect.top + rect.height / 2 - vh / 2) * (Number(node.dataset.parallax) || 0.08);
      node.style.transform = `translate3d(0,${offset.toFixed(1)}px,0) scale(1.12)`;
    }
  };
  onScroll(update);
  document.addEventListener('rv:motion', update);
  update();
}

/* Índice lateral de seções com destaque da seção atual */
function setupScrollSpy() {
  const links = $$('.page-index a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  const map = new Map(links.map((link) => [link.getAttribute('href').slice(1), link]));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      links.forEach((link) => link.removeAttribute('aria-current'));
      map.get(entry.target.id)?.setAttribute('aria-current', 'true');
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, id) => { const section = document.getElementById(id); if (section) observer.observe(section); });
}
onInit(setupReveal);
onInit(setupCounters);
onInit(setupFillText);
onInit(setupParallax);
onInit(setupScrollSpy);

/* 25-ui.js */
/* Componentes reutilizáveis: abas acessíveis, seletor de cenário e trilho arrastável. */
function setupTabs() {
  $$('[data-tabs]').forEach((root) => {
    const tabs = $$('[role="tab"]', root);
    if (!tabs.length) return;
    const select = (tab, focus) => {
      tabs.forEach((item) => {
        const active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
        const panel = document.getElementById(item.getAttribute('aria-controls'));
        if (panel) panel.hidden = !active;
      });
      if (focus) tab.focus();
      root.dispatchEvent(new CustomEvent('tabchange', { detail: { tab }, bubbles: true }));
    };
    tabs.forEach((tab) => tab.addEventListener('click', () => select(tab, false)));
    root.addEventListener('keydown', (event) => {
      const index = tabs.indexOf(document.activeElement);
      if (index < 0) return;
      const keys = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: tabs.length - 1 };
      if (!(event.key in keys)) return;
      event.preventDefault();
      select(tabs[(keys[event.key] + tabs.length) % tabs.length], true);
    });
  });
}
function setupScenarioPicker() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-scenario-set]');
    if (!button) return;
    const lab = button.closest('[data-scenario]');
    if (!lab) return;
    lab.dataset.scenario = button.dataset.scenarioSet;
    $$('[data-scenario-set]', lab).forEach((item) => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active)); });
  });
}
function setupRails() {
  $$('[data-rail]').forEach((rail) => {
    let down = false; let startX = 0; let startLeft = 0; let moved = false;
    rail.addEventListener('pointerdown', (event) => { if (event.pointerType !== 'mouse') return; down = true; moved = false; startX = event.clientX; startLeft = rail.scrollLeft; });
    window.addEventListener('pointermove', (event) => { if (!down) return; const dx = event.clientX - startX; if (Math.abs(dx) > 5) moved = true; rail.scrollLeft = startLeft - dx; });
    window.addEventListener('pointerup', () => { down = false; });
    rail.addEventListener('click', (event) => { if (moved) { event.preventDefault(); event.stopPropagation(); moved = false; } }, true);
    rail.addEventListener('keydown', (event) => {
      if (event.target !== rail || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      rail.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * 300, behavior: scrollBehavior() });
    });
  });
}
onInit(setupTabs);
onInit(setupScenarioPicker);
onInit(setupRails);

/* 30-home.js */
/* Mídia da abertura: fotografia publicada (D1/R2) e, se houver, vídeo autorizado. */
function renderHeroMedia() {
  const media = state.data?.heroImage;
  const heroImage = $('[data-hero-image]');
  if (media && safeMediaPath(media.key) && heroImage) {
    heroImage.src = `/${media.key}`;
    heroImage.alt = media.alt_text || 'Fotografia de veículo selecionada para o projeto Rota / Vetor.';
    const srcset = mediaSrcset(media.key);
    if (srcset) heroImage.srcset = srcset; else heroImage.removeAttribute('srcset');
    const caption = media.caption || media.alt_text || 'Imagem selecionada para o projeto.';
    const credit = [media.attribution, media.license].filter(Boolean).join(' · ') || 'Crédito e licença não registrados';
    if ($('#hero-image-caption')) $('#hero-image-caption').textContent = caption;
    if ($('#hero-image-credit')) $('#hero-image-credit').textContent = credit;
    const sourceNode = $('#hero-image-source');
    if (sourceNode) { const href = safeLink(media.source_url); if (href === '#') sourceNode.hidden = true; else { sourceNode.hidden = false; sourceNode.href = href; } }
  }
  const frame = $('[data-hero-frame]');
  if (heroImage && frame && !heroImage.dataset.fallbackBound) {
    heroImage.dataset.fallbackBound = 'true';
    heroImage.addEventListener('error', () => {
      heroImage.hidden = true;
      frame.classList.add('is-failed');
      if (!$('.hero-media-fallback', frame)) { const fallback = document.createElement('div'); fallback.className = 'hero-media-fallback'; fallback.textContent = 'Fotografia temporariamente indisponível'; frame.append(fallback); }
    }, { once: true });
  }
  renderHeroVideo();
}
function renderHeroVideo() {
  const info = state.data?.heroVideo;
  const frame = $('[data-hero-frame]');
  const toggle = $('[data-video-toggle]');
  if (!info || !frame || !toggle || !safeVideoPath(info.key) || $('video', frame)) return;
  if (prefersReducedMotion() || navigator.connection?.saveData) return;
  const mime = ['video/mp4', 'video/webm'].includes(info.mime_type) ? info.mime_type : (/\.webm$/i.test(info.key) ? 'video/webm' : 'video/mp4');
  const video = document.createElement('video');
  video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'metadata';
  video.setAttribute('role', 'img'); video.setAttribute('aria-label', info.alt_text || 'Vídeo de abertura');
  const poster = state.data.heroVideoPoster;
  if (poster && safeMediaPath(poster.key)) video.poster = `/${poster.key}`;
  const source = document.createElement('source'); source.src = `/${info.key}`; source.type = mime; video.append(source);
  let userPaused = false;
  const sync = () => { toggle.textContent = video.paused ? 'Reproduzir vídeo' : 'Pausar vídeo'; toggle.setAttribute('aria-pressed', String(video.paused)); };
  video.addEventListener('playing', () => { frame.classList.add('has-video'); sync(); });
  video.addEventListener('pause', sync);
  frame.append(video);
  toggle.hidden = false;
  toggle.addEventListener('click', () => { if (video.paused) { userPaused = false; video.play().catch(() => {}); } else { userPaused = true; video.pause(); } });
  document.addEventListener('rv:motion', (event) => { if (!event.detail.on) video.pause(); else if (!userPaused) video.play().catch(() => {}); });
  if (motionOn()) video.play().catch(() => sync());
  const caption = info.caption || info.alt_text; const credit = [info.attribution, info.license].filter(Boolean).join(' · ');
  if ($('#hero-image-caption')) $('#hero-image-caption').textContent = caption || '';
  if ($('#hero-image-credit')) $('#hero-image-credit').textContent = credit;
  const sourceNode = $('#hero-image-source');
  if (sourceNode) { const href = safeLink(info.source_url); if (href === '#') sourceNode.hidden = true; else { sourceNode.hidden = false; sourceNode.href = href; } }
}
function renderLiveStats() {
  const item = $('[data-live-sources]');
  const count = state.data?.sources?.length;
  if (!item || !count) return;
  item.hidden = false;
  const number = $('[data-count]', item);
  number.dataset.count = String(count);
  number.dataset.counted = '1';
  animateCount(number, count);
}
onData(renderHeroMedia);
onData(renderLiveStats);

/* 40-quality.js */
/* Página Qualidade: dimensões (acordeão + mostrador), percurso, cadeia, influências e ciclo PDCA. */
function setupDimensions() {
  const items = $$('.dim');
  if (!items.length) return;
  const dial = $('[data-dial]');
  const nodes = [];
  const setOpen = (item, open, { scroll = false } = {}) => {
    item.classList.toggle('is-open', open);
    $('.dim-toggle', item).setAttribute('aria-expanded', String(open));
    if (open) {
      items.forEach((other) => { if (other !== item && other.classList.contains('is-open')) { other.classList.remove('is-open'); $('.dim-toggle', other).setAttribute('aria-expanded', 'false'); } });
      syncDial(items.indexOf(item));
      if (scroll) setTimeout(() => item.scrollIntoView({ block: 'start', behavior: scrollBehavior() }), 60);
    } else if (!items.some((other) => other.classList.contains('is-open'))) syncDial(-1);
  };
  const center = dial ? document.createElement('div') : null;
  const syncDial = (index) => {
    nodes.forEach((node, i) => node.setAttribute('aria-pressed', String(i === index)));
    if (!center) return;
    center.innerHTML = index < 0 ? '<strong>10</strong><span>dimensões da qualidade</span>' : `<strong>${String(index + 1).padStart(2, '0')}</strong><span>${escapeHTML(items[index].dataset.name)}</span>`;
  };
  if (dial) {
    const ring = document.createElement('div'); ring.className = 'dial-ring'; dial.append(ring);
    center.className = 'dial-center'; center.setAttribute('aria-hidden', 'true'); dial.append(center);
    items.forEach((item, index) => {
      const angle = (index / items.length) * Math.PI * 2 - Math.PI / 2;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'dial-node'; button.textContent = String(index + 1);
      button.setAttribute('aria-label', `Dimensão ${index + 1}: ${item.dataset.name}`); button.setAttribute('aria-pressed', 'false');
      button.style.left = `${50 + Math.cos(angle) * 39}%`; button.style.top = `${50 + Math.sin(angle) * 39}%`;
      button.addEventListener('click', () => setOpen(item, true, { scroll: true }));
      dial.append(button); nodes.push(button);
    });
    syncDial(-1);
  }
  items.forEach((item) => $('.dim-toggle', item).addEventListener('click', () => setOpen(item, !item.classList.contains('is-open'))));
  const fromHash = () => { const target = location.hash && document.getElementById(location.hash.slice(1)); if (target?.classList.contains('dim')) { setOpen(target, true, { scroll: true }); } };
  window.addEventListener('hashchange', fromHash);
  if (location.hash) setTimeout(fromHash, 250); else setOpen(items[0], true);
}

function setupJourney() {
  const root = $('[data-journey]');
  if (!root) return;
  const tabs = $$('[role="tab"]', root);
  const prev = $('[data-journey-prev]', root); const next = $('[data-journey-next]', root);
  const sync = () => {
    const index = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    root.style.setProperty('--p', String(index / (tabs.length - 1)));
    tabs.forEach((tab, i) => tab.classList.toggle('is-done', i < index));
    prev.disabled = index === 0; next.disabled = index === tabs.length - 1;
    prev.toggleAttribute('aria-disabled', index === 0); next.toggleAttribute('aria-disabled', index === tabs.length - 1);
  };
  root.addEventListener('tabchange', sync);
  const go = (delta) => { const index = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true') + delta; if (tabs[index]) tabs[index].click(); };
  prev.addEventListener('click', () => go(-1)); next.addEventListener('click', () => go(1));
  sync();
}

const chainSteps = [
  { title: 'Material adequado', gives: 'Uma base com propriedades compatíveis com a função da peça.', needs: 'Do requisito de projeto e do ambiente de uso previstos.', enables: 'Peças que podem ser fabricadas e acabadas dentro do especificado.' },
  { title: 'Precisão dimensional', gives: 'Dimensões e superfícies dentro dos limites definidos para cada peça.', needs: 'Do material escolhido e do processo de fabricação e medição.', enables: 'Encaixes previsíveis e desgaste dentro do esperado.' },
  { title: 'Montagem correta', gives: 'Peças conectadas como previsto, com as interfaces e os esforços corretos.', needs: 'De peças dentro das tolerâncias e de um método de instalação definido.', enables: 'Um conjunto que funciona como sistema, não como peças soltas.' },
  { title: 'Inspeção', gives: 'Evidência de que os requisitos foram, ou não, atendidos.', needs: 'De critérios de aceitação, instrumentos e método definidos.', enables: 'Decidir com base em dados: aprovar, corrigir ou investigar a causa.' },
  { title: 'Confiabilidade ao longo do uso', gives: 'A função mantida ao longo do tempo, nas condições de uso.', needs: 'De todos os elos anteriores, mais manutenção adequada e condições de operação compatíveis.', enables: 'Disponibilidade e segurança na operação do veículo.' },
];
function setupChain() {
  const root = $('[data-chain]');
  if (!root) return;
  const nodes = $$('[data-chain-node]', root);
  const detail = $('.chain-detail', root);
  const select = (index) => {
    nodes.forEach((node, i) => { node.setAttribute('aria-pressed', String(i === index)); node.classList.toggle('is-lit', i <= index); node.closest('li').classList.toggle('is-linked', i < index); });
    const step = chainSteps[index];
    $('[data-chain-title]', root).textContent = step.title;
    $('[data-chain-gives]', root).textContent = step.gives;
    $('[data-chain-needs]', root).textContent = step.needs;
    $('[data-chain-enables]', root).textContent = step.enables;
    detail.classList.remove('is-swapping'); void detail.offsetWidth; detail.classList.add('is-swapping');
  };
  nodes.forEach((node, index) => node.addEventListener('click', () => { stop(); select(index); }));
  let timer = null;
  const play = $('[data-chain-play]', root);
  const stop = () => { clearInterval(timer); timer = null; };
  play.addEventListener('click', () => {
    stop();
    if (!motionOn()) { select(chainSteps.length - 1); return; }
    let index = 0; select(0);
    timer = setInterval(() => { index += 1; if (index >= chainSteps.length) { stop(); return; } select(index); }, 1500);
  });
  select(0);
}

function setupInfluence() {
  const root = $('[data-influence]');
  if (!root) return;
  const panels = $$('.influence-panel', root);
  panels.forEach((panel) => $('.influence-toggle', panel).addEventListener('click', () => {
    panels.forEach((other) => { const open = other === panel; other.classList.toggle('is-open', open); $('.influence-toggle', other).setAttribute('aria-expanded', String(open)); });
  }));
}

function setupPdca() {
  const root = $('[data-pdca]');
  if (!root) return;
  const tabs = $$('[role="tab"]', root);
  root.addEventListener('tabchange', () => {
    const index = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    root.style.setProperty('--a', `${index * 90}deg`);
  });
}
onInit(setupDimensions);
onInit(setupJourney);
onInit(setupChain);
onInit(setupInfluence);
onInit(setupPdca);

/* 50-history.js */
/* História: linha do tempo filtrável, faixas e detalhe com fonte. */
function timelineItems() {
  const all = (state.data?.timeline || []).slice().sort((a, b) => (a.sort_order - b.sort_order) || String(a.date_label).localeCompare(String(b.date_label)));
  return state.filterTimeline === 'all' ? all : all.filter((item) => item.subject === state.filterTimeline);
}
function renderTimelineDetail(item) {
  const node = $('#timeline-detail');
  if (!node) return;
  if (!item) { return; }
  node.innerHTML = `<p class="kicker">${escapeHTML(item.date_label)} · ${escapeHTML(labelSubject(item.subject))}</p><h3 class="h-card">${escapeHTML(item.title)}</h3><p>${escapeHTML(item.body)}</p>${item.source_url ? sourceLink(item.source_url, item.source_title || 'Abrir fonte original') : '<p class="micro">Fonte não registrada para este marco.</p>'}`;
  node.classList.remove('is-swap'); void node.offsetWidth; node.classList.add('is-swap');
}
function renderTimeline() {
  const list = $('#timeline-list');
  if (!list || !state.data) return;
  const items = timelineItems();
  if (!items.length) { list.innerHTML = '<li class="loading-card">Nenhum marco publicado neste filtro.</li>'; return; }
  if (!items.some((item) => String(item.id) === String(state.activeTimelineId))) state.activeTimelineId = items[0].id;
  list.innerHTML = items.map((item) => `<li class="tl-item tl-${escapeHTML(item.subject)}"><button type="button" data-timeline-id="${escapeHTML(item.id)}" aria-pressed="${String(item.id) === String(state.activeTimelineId)}"><span class="tl-date">${escapeHTML(item.date_label)}</span><span class="tl-body"><small>${escapeHTML(labelSubject(item.subject))}</small><strong>${escapeHTML(item.title)}</strong></span></button></li>`).join('');
  renderTimelineDetail(items.find((item) => String(item.id) === String(state.activeTimelineId)));
  updateTimelineProgress();
}
function updateTimelineProgress() {
  const bar = $('#timeline-progress');
  const list = $('#timeline-list');
  if (!bar || !list) return;
  const rect = list.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (window.innerHeight * 0.65 - rect.top) / Math.max(1, rect.height)));
  bar.style.setProperty('--draw', motionOn() ? progress.toFixed(3) : '1');
}
function setupHistory() {
  document.addEventListener('click', (event) => {
    const filter = event.target.closest('[data-timeline-filter]');
    if (filter) {
      state.filterTimeline = filter.dataset.timelineFilter;
      $$('[data-timeline-filter]').forEach((chip) => { const on = chip === filter; chip.classList.toggle('is-active', on); chip.setAttribute('aria-pressed', String(on)); });
      renderTimeline();
      return;
    }
    const lane = event.target.closest('[data-lane]');
    if (lane) {
      const target = lane.dataset.lane;
      const chip = $(`[data-timeline-filter="${target}"]`);
      if (chip) chip.click();
      $('#timeline')?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      return;
    }
    const item = event.target.closest('[data-timeline-id]');
    if (item) {
      state.activeTimelineId = item.dataset.timelineId;
      $$('[data-timeline-id]').forEach((button) => button.setAttribute('aria-pressed', String(button === item)));
      renderTimelineDetail(timelineItems().find((entry) => String(entry.id) === String(state.activeTimelineId)));
    }
  });
  if ($('#timeline-progress')) onScroll(updateTimelineProgress);
}
onInit(setupHistory);
onData(renderTimeline);

/* 60-parts.js */
/* Peças: seletor de sistemas, painel em três partes, marcadores sobre a fotografia. */
const componentPanels = {
  engine: { title: 'Motor', what: 'Converte a energia do combustível ou de outra fonte em potência mecânica.', why: 'É o ponto de partida da tração. Projeto, materiais internos, calibração e manutenção influenciam consumo, durabilidade e resposta ao uso.', watch: 'Especificação do motor para a versão consultada e os intervalos de manutenção do fabricante.' },
  transmission: { title: 'Transmissão', what: 'Relaciona a rotação e o torque do motor às necessidades de velocidade e esforço nas rodas.', why: 'Boa relação entre marchas e missão reduz esforço, desgaste e consumo. A escolha depende de carga, relevo e tipo de operação.', watch: 'Tipo de câmbio (manual, automatizado ou automático) e as relações indicadas na ficha da versão.' },
  driveline: { title: 'Trem de força', what: 'Conjunto que leva a potência da transmissão aos eixos: cardãs, juntas e diferenciais.', why: 'Alinhamento e balanceamento afetam vibração, ruído e vida útil. Falhas aqui costumam aparecer como vibração em velocidade.', watch: 'Folgas, ruídos e o plano de lubrificação previsto para o modelo.' },
  brakes: { title: 'Freios', what: 'Reduzem a velocidade e imobilizam o veículo, convertendo energia de movimento em calor.', why: 'É um sistema de segurança. Dimensionamento, materiais de atrito e manutenção definem distância de frenagem e resistência ao aquecimento.', watch: 'Desgaste de lonas ou pastilhas, estado dos discos ou tambores e a revisão periódica recomendada.' },
  axles: { title: 'Eixos', what: 'Sustentam o peso do veículo e da carga e transmitem esforços entre rodas e chassi.', why: 'Capacidade, relação de redução e rigidez determinam a missão adequada do caminhão.', watch: 'Capacidade técnica por eixo e a configuração (4x2, 6x2, 6x4) da versão.' },
  wheels: { title: 'Rodas e pneus', what: 'Fazem o contato com o piso: transmitem tração, frenagem e direção.', why: 'Pressão, desgaste e especificação influenciam segurança, consumo e custo por quilômetro.', watch: 'Pressão calibrada, desgaste uniforme e a medida indicada para a versão.' },
  cab: { title: 'Cabine', what: 'Abriga o motorista e concentra comandos, visibilidade e proteção.', why: 'Ergonomia, vedação e visibilidade afetam fadiga e segurança em jornadas longas.', watch: 'Visibilidade, ajuste de assento e volante, acabamento e vedação.' },
  fuel: { title: 'Alimentação', what: 'Armazena e conduz o combustível ao motor, com filtragem e controle da injeção.', why: 'Qualidade do combustível e dos filtros protege componentes de alta precisão e sustenta o desempenho.', watch: 'Troca de filtros no intervalo previsto e a qualidade do combustível abastecido.' },
};
function renderComponent(key) {
  const node = $('#component-detail');
  const base = componentPanels[key];
  if (!node || !base) return;
  const override = state.data?.pages?.find((page) => page.slug === `pecas-${key}`);
  const title = override?.title || base.title;
  const extra = override?.body_markdown ? `<div class="component-extra prose">${renderMarkdown(override.body_markdown)}</div>` : '';
  const kicker = override?.kicker || 'Sistema · função geral';
  node.innerHTML = `<p class="kicker">${escapeHTML(kicker)}</p><h3 class="h-section">${escapeHTML(title)}</h3><div class="component-parts"><section><h4>O que é</h4><p>${escapeHTML(base.what)}</p></section><section><h4>Por que importa</h4><p>${escapeHTML(base.why)}</p></section><section><h4>O que observar</h4><p>${escapeHTML(base.watch)}</p></section></div>${extra}`;
  node.classList.remove('is-swap'); void node.offsetWidth; node.classList.add('is-swap');
}
function selectComponent(key, updateUrl) {
  if (!componentPanels[key]) return;
  $$('[data-component]').forEach((button) => { const on = button.dataset.component === key; button.classList.toggle('is-active', on); button.setAttribute('aria-pressed', String(on)); });
  renderComponent(key);
  if (updateUrl) { try { history.replaceState(null, '', `?sistema=${key}${location.hash}`); } catch { /* ignorado */ } }
}
function setupComponents() {
  const buttons = $$('[data-component]');
  if (!buttons.length) return;
  buttons.forEach((button) => button.addEventListener('click', () => selectComponent(button.dataset.component, true)));
  const initial = new URLSearchParams(location.search).get('sistema');
  if (initial && componentPanels[initial]) selectComponent(initial, false);
}
function activeComponentKey() { return $('[data-component].is-active')?.dataset.component || 'engine'; }
function renderExplorerImage() {
  const media = state.data?.explorerImage;
  const image = $('[data-explorer-image]');
  if (!image) return;
  if (media && safeMediaPath(media.key)) {
    image.src = `/${media.key}`;
    image.alt = media.alt_text || image.alt;
    const set = mediaSrcset(media.key);
    if (set) image.srcset = set; else image.removeAttribute('srcset');
    const credit = [media.caption, media.attribution, media.license].filter(Boolean).join(' · ');
    if (credit && $('#image-credit-text')) $('#image-credit-text').textContent = credit;
    const href = safeLink(media.source_url);
    if ($('#explore-image-source') && href !== '#') $('#explore-image-source').href = href;
  }
  const canvas = image.closest('.truck-canvas');
  image.addEventListener('error', () => { image.hidden = true; $('.explorer-media-fallback', canvas)?.removeAttribute('hidden'); }, { once: true });
}
function renderHotspots() {
  const holder = $('#hotspots');
  if (!holder || !state.data) return;
  const spots = (state.data.hotspots || []).filter((spot) => !spot.model_id);
  if (!spots.length) { holder.innerHTML = ''; return; }
  holder.innerHTML = spots.map((spot, index) => `<button type="button" class="hotspot" data-hotspot="${escapeHTML(spot.id)}" aria-pressed="false" aria-label="${escapeHTML(spot.label)}" style="left:${Number(spot.x_pct) || 0}%;top:${Number(spot.y_pct) || 0}%"><span>${index + 1}</span></button>`).join('');
}
function showHotspot(id) {
  const spot = state.data?.hotspots?.find((item) => String(item.id) === String(id));
  const detail = $('#hotspot-detail');
  if (!spot || !detail) return;
  state.activeHotspot = id;
  $$('[data-hotspot]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.hotspot === String(id))));
  const src = sourceFor(spot.source_id);
  $('.info-placeholder')?.setAttribute('hidden', '');
  detail.hidden = false;
  detail.innerHTML = `<p class="kicker">Elemento visível</p><h3 class="h-card">${escapeHTML(spot.label)}</h3><p>${escapeHTML(spot.explanation)}</p>${src ? sourceLink(src.url, src.title) : ''}`;
}
function setupHotspots() {
  document.addEventListener('click', (event) => { const button = event.target.closest('[data-hotspot]'); if (button) showHotspot(button.dataset.hotspot); });
}
onInit(setupComponents);
onInit(setupHotspots);
onData(() => { renderExplorerImage(); renderHotspots(); renderComponent(activeComponentKey()); });

/* 70-performance.js */
/* Desempenho: simulador didático (mesma fórmula validada no Worker) e, se houver, eventos reais. */
const missionLabels = { 1: 'Economizar recursos', 2: 'Equilíbrio', 3: 'Entregar no prazo' };
function scenarioMath(mission, resources) {
  const target = mission === 1 ? 45 : mission === 2 ? 60 : 80;
  const goal = Math.max(35, Math.min(95, Math.round((mission === 1 ? 82 : mission === 2 ? 70 : 92) - Math.abs(resources - target) * 0.25)));
  const points = Math.max(40, Math.min(96, Math.round(resources * 0.52 + goal * 0.48)));
  return { goal, points };
}
function updateScenario() {
  const missionInput = $('#mission-range'); const resourceInput = $('#resource-range');
  if (!missionInput || !resourceInput) return;
  const mission = Number(missionInput.value); const resources = Number(resourceInput.value);
  const { goal, points } = scenarioMath(mission, resources);
  const copy = {
    1: ['Poupar recursos primeiro', 'A prioridade está em usar menos. Com recursos amplos demais, o cenário sobra e perde objetivo; com poucos, a entrega sofre.'],
    2: ['Equilibrar entrega e consumo', 'O cenário ilustra um compromisso entre recursos e objetivo. O resultado é apenas uma escala de aprendizagem.'],
    3: ['Priorizar a entrega no prazo', 'Cumprir o prazo costuma exigir mais recursos. O cenário mostra o custo desse compromisso, sem representar um veículo.'],
  }[mission];
  $('#mission-output').textContent = missionLabels[mission];
  $('#resource-output').textContent = `${resources} / 100`;
  $('#scenario-score').textContent = String(points);
  $('#gauge-ring')?.style.setProperty('--score', String(points));
  $('#scenario-title').textContent = copy[0];
  $('#scenario-copy').textContent = copy[1];
  $('#resource-meter').style.setProperty('--w', `${resources}%`);
  $('#goal-meter').style.setProperty('--w', `${goal}%`);
  $('#resource-meter-value').textContent = String(resources);
  $('#goal-meter-value').textContent = String(goal);
  [missionInput, resourceInput].forEach((input) => { const pct = ((input.value - input.min) / (input.max - input.min)) * 100; input.style.setProperty('--fill', `${pct}%`); });
}
function setupSimulator() {
  ['#mission-range', '#resource-range'].forEach((selector) => $(selector)?.addEventListener('input', updateScenario));
  updateScenario();
}
/* Eventos e pontuação só aparecem se o Worker publicar um evento ativo que aceita pontuações. */
function activeScoreEvent() { return (state.data?.events || []).find((event) => event.accept_scores === 1); }
async function refreshLeaderboard(event) {
  const box = $('#leaderboard');
  if (!box || !event?.show_leaderboard) { if (box) box.hidden = true; return; }
  try {
    const response = await fetch(`/api/public/leaderboard?event=${encodeURIComponent(event.slug)}`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    const data = await response.json();
    if (!data.enabled || !data.scores?.length) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = `<h3 class="h-card">Placar do evento</h3><ol>${data.scores.map((row) => `<li><span>${escapeHTML(row.pseudonym)}</span><b>${escapeHTML(row.points)}</b></li>`).join('')}</ol>`;
  } catch { box.hidden = true; }
}
function renderEvents() {
  const section = $('#score-section');
  if (!section || !state.data) return;
  const events = state.data.events || [];
  if (!events.length) { section.hidden = true; return; }
  section.hidden = false;
  $('#event-list').innerHTML = events.map((event) => `<article class="event-card"><p class="micro">Evento publicado</p><h3 class="h-card">${escapeHTML(event.title)}</h3><p>${escapeHTML(event.description)}</p></article>`).join('');
  const scoreEvent = activeScoreEvent();
  const game = (state.data.games || []).find((item) => /simul/i.test(`${item.slug} ${item.game_type}`)) || (state.data.games || [])[0];
  $('#score-form').hidden = !(scoreEvent && game);
  refreshLeaderboard(events.find((event) => event.show_leaderboard === 1));
}
async function handleScoreSubmit(submit) {
  submit.preventDefault();
  const event = activeScoreEvent();
  const game = (state.data?.games || []).find((item) => /simul/i.test(`${item.slug} ${item.game_type}`)) || (state.data?.games || [])[0];
  const status = $('#score-status');
  if (!event || !game) { status.textContent = 'Nenhum evento aceita pontuações agora.'; return; }
  const button = $('button[type="submit"]', submit.currentTarget); button.disabled = true;
  try {
    const response = await fetch('/api/public/scores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: event.slug, game: game.slug, pseudonym: $('#score-pseudonym').value, consent: $('#score-consent').checked, mission: Number($('#mission-range').value), resources: Number($('#resource-range').value) }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Não foi possível enviar.');
    status.textContent = 'Pontuação registrada. Obrigado!';
    toast('Pontuação registrada.');
    refreshLeaderboard(event);
  } catch (error) { status.textContent = error.message; } finally { button.disabled = false; }
}
onInit(setupSimulator);
onInit(() => $('#score-form')?.addEventListener('submit', handleScoreSubmit));
onData(renderEvents);

/* 80-models.js */
/* Modelos: famílias, variantes, filtros, setas, pontos, teclado e ficha em diálogo. */
const normalizeText = (value) => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
function modelFamilies() {
  const map = new Map();
  for (const model of state.data?.models || []) {
    const key = normalizeText(`${model.brand} ${model.model}`);
    if (!map.has(key)) map.set(key, { key, brand: model.brand, model: model.model, category: model.category, variants: [] });
    map.get(key).variants.push(model);
  }
  const list = [...map.values()];
  return state.filterModels === 'all' ? list : list.filter((family) => normalizeText(family.category) === state.filterModels || normalizeText(family.category).startsWith(state.filterModels.slice(0, 5)));
}
function activeVariant(family) {
  const index = Math.min(state.activeVariants[family.key] || 0, family.variants.length - 1);
  return family.variants[index];
}
function modelImage(model, sizes) {
  if (!safeMediaPath(model.image_key)) return '<div class="model-noimg" aria-hidden="true">Sem imagem</div>';
  const set = mediaSrcset(model.image_key);
  return `<img src="/${escapeHTML(model.image_key)}"${set ? ` srcset="${escapeHTML(set)}"` : ''} sizes="${sizes}" alt="${escapeHTML(model.image_alt_text || `${model.brand} ${model.model}`)}" loading="lazy" decoding="async">`;
}
function renderModels() {
  const grid = $('#models-grid');
  if (!grid || !state.data) return;
  const families = modelFamilies();
  $('#model-count').textContent = `${families.length} ${families.length === 1 ? 'família' : 'famílias'} publicada${families.length === 1 ? '' : 's'}`;
  if (state.activeModelIndex >= families.length) state.activeModelIndex = 0;
  if (!families.length) { grid.innerHTML = '<article class="loading-card">Nenhuma família publicada nesta categoria.</article>'; $('#catalog-dots').innerHTML = ''; return; }
  grid.innerHTML = families.map((family, index) => {
    const model = activeVariant(family);
    const variants = family.variants.length > 1 ? `<div class="variant-row" role="group" aria-label="Versões de ${escapeHTML(family.model)}">${family.variants.map((variant, i) => `<button type="button" class="chip" data-variant="${escapeHTML(family.key)}:${i}" aria-pressed="${variant === model}">${escapeHTML(variant.version || `Versão ${i + 1}`)}</button>`).join('')}</div>` : '';
    return `<article class="model-card${index === state.activeModelIndex ? ' is-current' : ''}" data-family="${escapeHTML(family.key)}" data-index="${index}"><div class="model-media">${modelImage(model, '(max-width: 700px) 86vw, 420px')}<span class="tag tag-fact">${escapeHTML(family.category || 'Categoria')}</span></div><div class="model-body"><p class="micro">${escapeHTML(family.brand)}${model.year ? ` · ${escapeHTML(model.year)}` : ''}${model.region ? ` · ${escapeHTML(model.region)}` : ''}</p><h3 class="h-card">${escapeHTML(family.model)}</h3><p>${escapeHTML(model.summary)}</p>${variants}<button class="button model-open" type="button" data-model-open="${escapeHTML(model.id)}">Abrir ficha <span class="arrow" aria-hidden="true">→</span></button></div></article>`;
  }).join('');
  $('#catalog-dots').innerHTML = families.map((family, index) => `<button type="button" class="dot" data-dot="${index}" aria-label="${escapeHTML(family.model)}" aria-pressed="${index === state.activeModelIndex}"></button>`).join('');
}
function goToModel(index) {
  const cards = $$('.model-card');
  if (!cards.length) return;
  state.activeModelIndex = (index + cards.length) % cards.length;
  cards.forEach((card, i) => card.classList.toggle('is-current', i === state.activeModelIndex));
  $$('[data-dot]').forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === state.activeModelIndex)));
  const grid = $('#models-grid');
  const card = cards[state.activeModelIndex];
  grid.scrollTo({ left: card.offsetLeft - grid.offsetLeft - (grid.clientWidth - card.clientWidth) / 2, behavior: scrollBehavior() });
}
function openModel(id) {
  const model = (state.data?.models || []).find((item) => String(item.id) === String(id));
  const dialog = $('#model-dialog');
  if (!model || !dialog) return;
  const specs = (state.data.specs || []).filter((spec) => String(spec.model_id) === String(model.id));
  const specRows = specs.length ? `<table class="spec-table"><caption class="visually-hidden">Especificações publicadas</caption><thead><tr><th scope="col">Item</th><th scope="col">Valor</th><th scope="col">Condição e fonte</th></tr></thead><tbody>${specs.map((spec) => { const src = sourceFor(spec.source_id); return `<tr><th scope="row">${escapeHTML(spec.label)}</th><td>${escapeHTML(spec.value)}${spec.unit ? ` ${escapeHTML(spec.unit)}` : ''}</td><td>${escapeHTML(spec.conditions || 'Condições não informadas')}${src ? `<br>${sourceLink(src.url, src.title)}` : ''}</td></tr>`; }).join('')}</tbody></table>` : '<p class="loading-card">Nenhuma especificação publicada para este modelo. Nada foi estimado.</p>';
  const credit = [model.image_caption, model.image_attribution, model.image_license].filter(Boolean).join(' · ');
  $('#model-dialog-content').innerHTML = `<div class="dialog-head"><div class="dialog-img">${modelImage(model, '(max-width: 800px) 90vw, 460px')}</div><div><p class="kicker">${escapeHTML(model.brand)} · ${escapeHTML(model.category || '')}</p><h2 id="model-dialog-title" class="h-section">${escapeHTML(model.model)}</h2><p class="micro">${[model.version, model.year, model.region].filter(Boolean).map(escapeHTML).join(' · ') || 'Versão, ano e mercado não informados'}</p><p>${escapeHTML(model.summary)}</p>${model.source_url ? sourceLink(model.source_url, model.source_title || 'Fonte do modelo') : ''}</div></div><h3 class="h-card">Especificações com fonte</h3>${specRows}<p class="micro dialog-credit">Imagem: ${escapeHTML(credit || 'crédito não registrado')} ${model.image_source_url ? sourceLink(model.image_source_url, 'origem') : ''}</p><p class="price-note">Preço não confirmado em fonte pública consultada.</p>`;
  if (!dialog.open) dialog.showModal();
}
function setupModels() {
  document.addEventListener('click', (event) => {
    const filter = event.target.closest('[data-model-filter]');
    if (filter) {
      state.filterModels = filter.dataset.modelFilter; state.activeModelIndex = 0;
      $$('[data-model-filter]').forEach((chip) => { const on = chip === filter; chip.classList.toggle('is-active', on); chip.setAttribute('aria-pressed', String(on)); });
      renderModels(); return;
    }
    const variant = event.target.closest('[data-variant]');
    if (variant) { const [key, i] = variant.dataset.variant.split(':'); state.activeVariants[key] = Number(i); renderModels(); goToModel(state.activeModelIndex); $(`[data-variant="${CSS.escape(variant.dataset.variant)}"]`)?.focus(); return; }
    const dot = event.target.closest('[data-dot]'); if (dot) { goToModel(Number(dot.dataset.dot)); return; }
    if (event.target.closest('[data-model-prev]')) { goToModel(state.activeModelIndex - 1); return; }
    if (event.target.closest('[data-model-next]')) { goToModel(state.activeModelIndex + 1); return; }
    const open = event.target.closest('[data-model-open]'); if (open) { openModel(open.dataset.modelOpen); return; }
    if (event.target.closest('[data-model-dialog-close]')) $('#model-dialog')?.close();
  });
  const dialog = $('#model-dialog');
  dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  $('#models-grid')?.addEventListener('keydown', (event) => {
    if (event.target.closest('button, a')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); goToModel(state.activeModelIndex + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); goToModel(state.activeModelIndex - 1); }
  });
}
onInit(setupModels);
onData(renderModels);

/* 90-experience.js */
/* Experiência: roteiro didático, atividades publicadas e quiz com validação no servidor. */
const experienceSteps = {
  requirement: ['Passo 01 · Requisito', 'O que precisa ser atendido?', 'Defina a função, o contexto, a medida e o critério antes de interpretar o resultado. Sem requisitos conhecidos, não há base para declarar conformidade.', 'Que evidência seria adequada para responder a essa pergunta?'],
  component: ['Passo 02 · Componente', 'O componente cumpre a sua função?', 'Verifique se o item corresponde à especificação: material, dimensão, acabamento e identificação. Compare com o critério, não com a impressão.', 'Qual característica do componente pode ser medida ou inspecionada?'],
  integration: ['Passo 03 · Integração', 'As partes funcionam juntas?', 'Um componente correto pode falhar na montagem. Encaixe, tolerância, torque e compatibilidade entre sistemas são parte da qualidade.', 'O que muda quando duas peças corretas são combinadas?'],
  operation: ['Passo 04 · Operação', 'O resultado se sustenta no uso?', 'Missão, carga, clima e manutenção definem se o desempenho se mantém. A confiança vem de evidências repetidas ao longo do tempo.', 'Quais condições de uso precisam ser registradas para comparar resultados?'],
};
function setupExperienceSteps() {
  const detail = $('#experience-detail');
  if (!detail) return;
  $$('[data-experience-step]').forEach((button) => button.addEventListener('click', () => {
    const data = experienceSteps[button.dataset.experienceStep];
    if (!data) return;
    $$('[data-experience-step]').forEach((item) => { const on = item === button; item.classList.toggle('is-active', on); item.setAttribute('aria-pressed', String(on)); });
    detail.innerHTML = `<p class="micro">${escapeHTML(data[0])}</p><h3 class="h-section">${escapeHTML(data[1])}</h3><p>${escapeHTML(data[2])}</p><div class="experience-prompt"><span>Registro didático</span><strong>${escapeHTML(data[3])}</strong></div>`;
    detail.classList.remove('is-swap'); void detail.offsetWidth; detail.classList.add('is-swap');
  }));
}
function renderGames() {
  const list = $('#game-list');
  const games = state.data?.games || [];
  if (!list || !games.length) return;
  list.hidden = false;
  list.innerHTML = `<h3 class="h-card">Atividades publicadas no painel</h3><ul>${games.map((game) => `<li><strong>${escapeHTML(game.title)}</strong><span>${escapeHTML(game.description)}</span></li>`).join('')}</ul>`;
}
function quizQuestions() { return state.data?.quizQuestions || []; }
function parseOptions(question) { try { return JSON.parse(question.options_json); } catch { return []; } }
function renderQuiz() {
  const section = $('#quiz');
  const box = $('#quiz-container');
  if (!section || !box) return;
  const enabled = state.data?.settings?.quizEnabled && quizQuestions().length;
  section.hidden = !enabled;
  if (!enabled) return;
  if (!state.quizStarted) {
    box.innerHTML = `<div class="quiz-card quiz-intro"><p class="micro">${quizQuestions().length} perguntas</p><h3 class="h-section">Pronto para testar?</h3><p>Cada resposta é validada no servidor, com explicação e fonte. Nada é salvo; sem cadastro, ranking ou cronômetro.</p><button class="button" type="button" data-quiz-start>Começar quiz <span class="arrow" aria-hidden="true">→</span></button></div>`;
    return;
  }
  if (state.quizFinished) {
    box.innerHTML = `<div class="quiz-card quiz-end"><p class="micro">Resultado deste percurso</p><h3 class="h-section">${state.quizCorrect} de ${quizQuestions().length}</h3><p>O resultado fica apenas nesta tela. Releia as fontes para aprofundar cada tema.</p><div class="quiz-actions"><button class="button" type="button" data-quiz-restart>Refazer</button><a class="button button-ghost" href="/fontes">Ver fontes</a></div></div>`;
    return;
  }
  const question = quizQuestions()[state.quizIndex];
  const options = parseOptions(question);
  box.innerHTML = `<div class="quiz-card" data-question="${escapeHTML(question.id)}"><div class="quiz-progress" aria-hidden="true"><i style="--w:${((state.quizIndex + 1) / quizQuestions().length) * 100}%"></i></div><p class="micro">Pergunta ${state.quizIndex + 1} de ${quizQuestions().length}</p><h3 class="h-card quiz-prompt" tabindex="-1">${escapeHTML(question.prompt)}</h3><div class="quiz-options" role="group" aria-label="Alternativas">${options.map((option, index) => `<button type="button" class="quiz-option" data-quiz-answer="${index}"><span class="opt-key">${String.fromCharCode(65 + index)}</span><span>${escapeHTML(option)}</span></button>`).join('')}</div><div class="quiz-feedback" aria-live="polite"></div></div>`;
  $('.quiz-prompt', box)?.focus({ preventScroll: true });
}
async function handleQuizSubmit(button) {
  const card = button.closest('[data-question]');
  if (!card || state.quizAnswered.has(card.dataset.question)) return;
  const index = Number(button.dataset.quizAnswer);
  $$('.quiz-option', card).forEach((option) => { option.disabled = true; });
  const feedback = $('.quiz-feedback', card);
  feedback.textContent = 'Validando no servidor…';
  try {
    const response = await fetch('/api/public/quiz/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question_id: card.dataset.question, answer_index: index }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível validar a resposta.');
    state.quizAnswered.add(card.dataset.question);
    if (data.correct) state.quizCorrect += 1;
    button.classList.add(data.correct ? 'is-correct' : 'is-wrong');
    const last = state.quizIndex >= quizQuestions().length - 1;
    feedback.innerHTML = `<p class="quiz-verdict ${data.correct ? 'ok' : 'no'}"><strong>${data.correct ? 'Resposta correta.' : 'Não foi desta vez.'}</strong> ${escapeHTML(data.explanation)}</p>${data.source_url ? sourceLink(data.source_url, data.source_title || 'Fonte') : ''}<button class="button" type="button" data-quiz-${last ? 'finish' : 'next'}>${last ? 'Ver resultado' : 'Próxima pergunta'} <span class="arrow" aria-hidden="true">→</span></button>`;
  } catch (error) {
    feedback.textContent = error.message;
    $$('.quiz-option', card).forEach((option) => { option.disabled = false; });
  }
}
function setupQuiz() {
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-quiz-start]')) { state.quizStarted = true; renderQuiz(); return; }
    const answer = event.target.closest('[data-quiz-answer]'); if (answer) { handleQuizSubmit(answer); return; }
    if (event.target.closest('[data-quiz-next]')) { state.quizIndex += 1; renderQuiz(); return; }
    if (event.target.closest('[data-quiz-finish]')) { state.quizFinished = true; renderQuiz(); return; }
    if (event.target.closest('[data-quiz-restart]')) { Object.assign(state, { quizIndex: 0, quizCorrect: 0, quizFinished: false, quizStarted: true, quizAnswered: new Set() }); renderQuiz(); }
  });
}
onInit(setupExperienceSteps);
onInit(setupQuiz);
onData(renderGames);
onData(renderQuiz);

/* 95-sources.js */
/* Fontes e conteúdo gerenciado: registro agrupado, créditos dinâmicos e páginas do painel. */
const sourceGroups = [
  ['Institucionais e corporativas', (s) => /iveco|cummins|meritor|cnh|ivecogroup/i.test(s.url) && !s.license],
  ['Imagens e licenças', (s) => Boolean(s.license) || /wikimedia|commons|creativecommons/i.test(s.url)],
  ['Técnicas, históricas e outras', () => true],
];
function renderSources() {
  const ledger = $('#source-ledger');
  if (!ledger || !state.data) return;
  const sources = state.data.sources || [];
  if (!sources.length) { ledger.innerHTML = '<p class="loading-card">Nenhuma fonte publicada até agora.</p>'; return; }
  const remaining = new Set(sources);
  const groups = sourceGroups.map(([title, test]) => { const items = sources.filter((source) => remaining.has(source) && test(source)); items.forEach((item) => remaining.delete(item)); return { title, items }; }).filter((group) => group.items.length);
  ledger.innerHTML = groups.map((group) => `<section class="ledger-group"><h3 class="h-card">${escapeHTML(group.title)}</h3><ul>${group.items.map((source) => `<li class="ledger-item"><div><strong>${escapeHTML(source.title)}</strong><span class="micro">${[source.publisher, source.published_at && `publicado ${source.published_at}`, source.accessed_at && `consultado ${source.accessed_at}`, source.license].filter(Boolean).map(escapeHTML).join(' · ')}</span>${source.summary ? `<p>${escapeHTML(source.summary)}</p>` : ''}</div>${sourceLink(source.url, 'Abrir')}</li>`).join('')}</ul></section>`).join('');
  const dyn = $('#credits-dyn');
  const images = state.data.models?.filter((model) => model.image_attribution).length;
  if (dyn && images) dyn.textContent = `Há ${images} imagem(ns) de modelos com crédito registrado no painel; abra a ficha do modelo para ver autor e licença.`;
}
const routeSlugs = ['home', 'historia', 'qualidade', 'pecas', 'desempenho', 'modelos', 'experiencia', 'fontes'];
function renderManagedPages() {
  const pages = state.data?.pages || [];
  const slug = document.body.dataset.page;
  const own = pages.find((page) => page.slug === slug || (slug === 'home' && page.slug === 'inicio'));
  if (own) {
    const block = document.createElement('section');
    block.className = 'section theme-light managed-route';
    block.innerHTML = `<div class="page-shell"><p class="kicker">${escapeHTML(own.kicker || 'Nota editorial')}</p><h2 class="h-section">${escapeHTML(own.title)}</h2><div class="prose">${renderMarkdown(own.body_markdown)}</div></div>`;
    $('#conteudo')?.append(block);
  }
  const listNode = $('#managed-pages-list');
  if (!listNode) return;
  const others = pages.filter((page) => !routeSlugs.includes(page.slug) && page.slug !== 'inicio' && !page.slug.startsWith('pecas-'));
  if (!others.length) return;
  $('#conteudos').hidden = false;
  listNode.innerHTML = others.map((page) => `<article class="managed-page"><p class="micro">${escapeHTML(page.kicker || 'Nota')}</p><h4 class="h-card">${escapeHTML(page.title)}</h4><div class="prose">${renderMarkdown(page.body_markdown)}</div></article>`).join('');
}
onData(renderSources);
onData(renderManagedPages);

/* 99-init.js */
function showLoadError(error) {
  const message = escapeHTML(error?.message || 'Conteúdo temporariamente indisponível.');
  const retry = '<button class="retry-button" type="button" data-site-retry>Tentar novamente</button>';
  for (const selector of ['#timeline-list', '#models-grid', '#source-ledger']) { const node = $(selector); if (node) node.innerHTML = `<div class="loading-card" role="alert">${message} ${retry}</div>`; }
  if ($('#quiz-container')) $('#quiz-container').innerHTML = '';
  toast('Alguns dados não carregaram. Tente novamente.');
}
async function loadSite() {
  try {
    const response = await fetch('/api/public/site', { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error('Não foi possível carregar os dados publicados.');
    const data = await response.json();
    if (!data || !Array.isArray(data.models) || !Array.isArray(data.timeline)) throw new Error('A resposta do conteúdo está incompleta.');
    state.data = data;
    for (const render of dataRenderers) { try { render(); } catch (error) { console.error(error); } }
  } catch (error) { showLoadError(error); }
}
document.addEventListener('click', (event) => { if (event.target.closest('[data-site-retry]')) loadSite(); });
for (const init of initializers) { try { init(); } catch (error) { console.error(error); } }
loadSite();

})();
