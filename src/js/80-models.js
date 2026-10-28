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
