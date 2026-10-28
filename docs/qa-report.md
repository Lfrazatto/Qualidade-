# Relatório de QA — Rota / Vetor

**Data:** 25 de outubro de 2026. **Produção:** <https://iveco-cummins-performance.lmpfrazatto.workers.dev/>. **Ferramentas:** Node build, Chromium headless/Playwright e axe-core. Os dados do site e do quiz foram lidos em produção; os registros de override editorial usados no teste específico foram simulados somente em memória. Nenhum score ou participante foi criado.

## Build, rotas e integridade

`npm run check` concluiu o build de oito documentos HTML, os ativos estáticos, 16 imagens WebP otimizadas e as checagens sintáticas de `dist/worker.mjs`, `src/app.js` e `src/admin.js`.

Playwright abriu diretamente as oito rotas de produção e encontrou o título, h1 e link de rota atual em cada página. As respostas foram HTTP 200. Foram testadas quatro larguras móveis/tablet (320, 390, 768 e 1024 px) em todas as oito rotas: 32 combinações, sem overflow horizontal. O menu móvel abriu, fechou e encaminhou à rota selecionada. `prefers-reduced-motion: reduce` reduziu a animação de entrada para `0.00001s`, com o conteúdo visível.

Uma comparação SHA-256 de produção com o build local confirmou igualdade das oito páginas e dos ativos públicos `styles.css`, `app.js` e `manus-routes.json`; o manifesto publica exatamente oito caminhos. A resposta da API pública de D1/R2 foi carregada sem erros de rede ou console no teste. O HTML do painel protegido também coincide com o build local no R2.

## Interações verificadas em produção

- Linha do tempo: filtro de conexões e seleção de marco.
- Qualidade: seleção da etapa de inspeção; a página lista dez dimensões gerais, sem atribuí-las a processos de fabricante.
- Peças: seleção didática de freios e hotspot externo da fotografia documental.
- Desempenho: ajuste do cenário e recálculo do indicador didático.
- Modelos: filtro de família e abertura/fechamento da ficha em diálogo.
- Experiência: etapa de operação e fluxo real de resposta do quiz validado pelo Worker. Foi enviado um POST para `/api/public/quiz/answer` e zero POST para `/api/public/scores`; o resultado não é persistido.
- Fontes: renderização do ledger editorial e das fontes reais.

A API pública retornou quatro modelos, nove marcos, doze especificações, nove fontes, três hotspots, duas experiências e quatro perguntas; não há evento pontuado. Os controles e estados visíveis corresponderam ao conteúdo. Os resultados completos em navegador estão nas imagens anexas.

## Conteúdo editável por D1

Um teste Playwright local interceptou `/api/public/site` somente em memória com registros `content_pages` publicados. Confirmou que um slug de rota (exemplo `qualidade`) cria o bloco complementar naquela página, que um slug de componente (exemplo `pecas-engine`) substitui título e texto no painel selecionado, e que páginas editoriais independentes continuam listadas em Fontes. Nenhum registro foi gravado no Cloudflare durante esse teste.

## Acessibilidade e responsividade

Axe-core executou 16 auditorias (oito rotas em desktop e celular), com regras WCAG 2.0/2.1 A/AA e WCAG 2.2 AA: zero violações reportadas. Playwright verificou nomes e estados de navegação, teclado nos controles e redução de movimento. A auditoria automática não é certificação WCAG; contraste sobre imagens, conteúdo editorial e contexto continuam sujeitos a revisão humana.

## Painel e segurança

Sem sessão, `iveco-cummins-performance-admin.lmpfrazatto.workers.dev/admin` respondeu HTTP 302 e encaminhou para o login do Cloudflare Access; o painel não foi exibido sem autenticação. O One-time PIN e a execução de CRUD com a sessão autorizada não foram testados, pois dependem do código enviado à identidade administrativa. O Worker mantém verificação de identidade/JWT configurada.

## Pendências conscientes

- Abertura usa imagem estática licenciada. Não foi identificado vídeo autorizado no conjunto de materiais; nenhum vídeo com reprodução automática foi inventado.
- A foto do explorador é arquivo do Tector na Fenatran 2017, substituível; não representa especificação do evento nem veículo de fábrica.
- Não se publica comparação de desempenho entre famílias porque versão, unidade, mercado, método e condições das medições não formam um conjunto comparável. As fichas individuais exibem as respectivas fontes.
- Confirmar acesso ao One-time PIN e testar um ciclo CRUD autenticado com o administrador autorizado.
- Se o responsável indicar veículo definitivo, fornecer a configuração/mercado, ficha técnica rastreável e mídia com permissão de uso.

## Verificação final do ledger e do ativo (25 de outubro de 2026)

Após o ajuste do renderer `renderSources`, `npm run check` concluiu novamente com sucesso. O build local final de `dist/site/app.js` tem 50.105 bytes e SHA-256 `bdb34df1412076640e06a8f326b659922983155c1a65c201e8c91dbf7c6d67b5`; a leitura de retorno do objeto R2 `site/app.js` e a resposta pública `GET /app.js` corresponderam exatamente ao mesmo hash.

No navegador de produção, `/fontes` renderizou nove fichas; todas exibiram `Consultado em: 2026-10-22`, e duas também exibiram data de publicação. Na viewport observada de 1280 px, a largura do documento foi 1265 px, sem overflow horizontal. A mudança foi somente textual dentro do parágrafo existente da fonte; não modificou D1, Worker, rotas, autenticação ou estrutura de página.

## Capturas de produção

- [Home — desktop (1440 px)](qa/published-home-desktop.png)
- [Home — celular (390 px)](qa/published-home-mobile.png)
- [Mapa e instruções](mapa-e-instrucoes.md)
- [Licenças e créditos](../assets/licenses.md)
- [Relatório das exatamente 20 referências de colaboração](../references/referencias-20.md)


## Redesenho de outubro de 2026 (preview local)

Executado com `scripts/preview/server.mjs` (Worker real, D1/R2 simulados com fixtures): `npm run check` passa; as oito rotas respondem 200 em acesso direto; zero erros de console e zero overflow horizontal em 1440 e 390 px; testados linha do tempo (filtros, faixas, detalhe), seletor de peças com `?sistema=`, hotspots (≥ 44 px), simulador (65/70 no padrão; 86/92 com missão 3 e recursos 80), catálogo (filtro, setas, ficha em diálogo, Esc), roteiro, quiz com POST validado pelo Worker, menu móvel, voltar do navegador, alternância e persistência de movimento, `prefers-reduced-motion`, Range 206 e rota de fontes. O host `/admin` redireciona (302) ao host administrativo. Não testados: login Access, CRUD, envio de pontuação, vídeo real e axe-core.
