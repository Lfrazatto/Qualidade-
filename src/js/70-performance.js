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
