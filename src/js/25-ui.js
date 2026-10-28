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
