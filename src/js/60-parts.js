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
