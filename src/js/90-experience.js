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
