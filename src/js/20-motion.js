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
