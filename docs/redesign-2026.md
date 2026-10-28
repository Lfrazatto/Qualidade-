# Redesenho visual, funcional e editorial (outubro de 2026)

## O que mudou
- Sistema visual novo (asfalto/grafite/aço/azul elétrico, seções escuras e claras alternadas, motivo de "cota"), fontes Inter autohospedadas servidas por `/fonts/*.woff`.
- Movimento: sequência de abertura em CSS, reveals por rolagem (uma vez), contadores, parallax leve, indicador animado no menu, menu móvel em tela cheia, transições de visualização entre documentos (`@view-transition`), botão "Pausar movimento" e respeito a `prefers-reduced-motion`.
- Home com a nova narrativa e `/qualidade` reescrita (10 dimensões, percurso, cadeia detalhe→resultado, 4 influências, melhoria contínua, conexão Cummins/IVECO separando conceito e fato).
- Páginas História, Peças, Desempenho, Modelos, Experiência e Fontes reescritas; todas as funções anteriores preservadas (filtros, linha do tempo, seletor e hotspots, simulador com a mesma fórmula do Worker, catálogo com variantes e ficha, quiz validado no servidor, eventos/placar apenas se publicados).
- Worker: suporte a vídeo de abertura opcional (`hero_video_key`), Range em `/media/*`, rota de fontes e `media-src 'self'` na CSP. Nenhum vídeo foi inventado.

## Para publicar
1. `npm run check`.
2. Enviar ao R2 (`iveco-cummins-media`) o conteúdo de `dist/site/` sob `site/…` (HTML, `styles.css`, `app.js`, `fonts/`), `dist/media/` sob `media/…` (inclui os novos recortes `detail-*`) e o `admin.html` atualizado.
3. Reimplantar o Worker (`dist/worker.mjs`), que agora serve `/fonts/*` e Range.
4. Opcional: enviar um vídeo autorizado pelo painel e preencher `hero_video_key`.

## Não verificado
- Nenhuma publicação no Cloudflare foi feita nesta etapa.
- Fluxo de login do painel (One-time PIN) e CRUD autenticado dependem da identidade autorizada.
- Dados do preview local são fixtures, não conteúdo publicado.
