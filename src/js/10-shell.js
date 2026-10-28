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
