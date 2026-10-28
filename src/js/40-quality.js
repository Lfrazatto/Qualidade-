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
