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
