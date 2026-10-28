/* Fontes e conteúdo gerenciado: registro agrupado, créditos dinâmicos e páginas do painel. */
const sourceGroups = [
  ['Institucionais e corporativas', (s) => /iveco|cummins|meritor|cnh|ivecogroup/i.test(s.url) && !s.license],
  ['Imagens e licenças', (s) => Boolean(s.license) || /wikimedia|commons|creativecommons/i.test(s.url)],
  ['Técnicas, históricas e outras', () => true],
];
function renderSources() {
  const ledger = $('#source-ledger');
  if (!ledger || !state.data) return;
  const sources = state.data.sources || [];
  if (!sources.length) { ledger.innerHTML = '<p class="loading-card">Nenhuma fonte publicada até agora.</p>'; return; }
  const remaining = new Set(sources);
  const groups = sourceGroups.map(([title, test]) => { const items = sources.filter((source) => remaining.has(source) && test(source)); items.forEach((item) => remaining.delete(item)); return { title, items }; }).filter((group) => group.items.length);
  ledger.innerHTML = groups.map((group) => `<section class="ledger-group"><h3 class="h-card">${escapeHTML(group.title)}</h3><ul>${group.items.map((source) => `<li class="ledger-item"><div><strong>${escapeHTML(source.title)}</strong><span class="micro">${[source.publisher, source.published_at && `publicado ${source.published_at}`, source.accessed_at && `consultado ${source.accessed_at}`, source.license].filter(Boolean).map(escapeHTML).join(' · ')}</span>${source.summary ? `<p>${escapeHTML(source.summary)}</p>` : ''}</div>${sourceLink(source.url, 'Abrir')}</li>`).join('')}</ul></section>`).join('');
  const dyn = $('#credits-dyn');
  const images = state.data.models?.filter((model) => model.image_attribution).length;
  if (dyn && images) dyn.textContent = `Há ${images} imagem(ns) de modelos com crédito registrado no painel; abra a ficha do modelo para ver autor e licença.`;
}
const routeSlugs = ['home', 'historia', 'qualidade', 'pecas', 'desempenho', 'modelos', 'experiencia', 'fontes'];
function renderManagedPages() {
  const pages = state.data?.pages || [];
  const slug = document.body.dataset.page;
  const own = pages.find((page) => page.slug === slug || (slug === 'home' && page.slug === 'inicio'));
  if (own) {
    const block = document.createElement('section');
    block.className = 'section theme-light managed-route';
    block.innerHTML = `<div class="page-shell"><p class="kicker">${escapeHTML(own.kicker || 'Nota editorial')}</p><h2 class="h-section">${escapeHTML(own.title)}</h2><div class="prose">${renderMarkdown(own.body_markdown)}</div></div>`;
    $('#conteudo')?.append(block);
  }
  const listNode = $('#managed-pages-list');
  if (!listNode) return;
  const others = pages.filter((page) => !routeSlugs.includes(page.slug) && page.slug !== 'inicio' && !page.slug.startsWith('pecas-'));
  if (!others.length) return;
  $('#conteudos').hidden = false;
  listNode.innerHTML = others.map((page) => `<article class="managed-page"><p class="micro">${escapeHTML(page.kicker || 'Nota')}</p><h4 class="h-card">${escapeHTML(page.title)}</h4><div class="prose">${renderMarkdown(page.body_markdown)}</div></article>`).join('');
}
onData(renderSources);
onData(renderManagedPages);
