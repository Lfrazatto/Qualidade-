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
