# Rota / Vetor — qualidade em movimento

Experiência editorial independente, em português brasileiro, sobre qualidade, desempenho, componentes, operação e história documentada de caminhões. O site não é oficial, afiliado, patrocinado ou aprovado por IVECO, Cummins ou Meritor e não afirma existir uma parceria atual entre essas empresas.

## Publicação

- **Site público:** <https://iveco-cummins-performance.lmpfrazatto.workers.dev/>
- **Painel administrativo protegido:** <https://iveco-cummins-performance-admin.lmpfrazatto.workers.dev/admin>
- **Documentação das rotas:** [`public/manus-routes.json`](public/manus-routes.json)

Cada item principal é uma rota própria, abre diretamente e funciona após recarregar:

| Rota | Conteúdo |
|---|---|
| `/` | Abertura editorial, foto licenciada, ideia central e caminhos de exploração |
| `/historia` | IVECO, Cummins e a European Engine Alliance em marcos com fontes |
| `/qualidade` | Percurso interativo e dez dimensões gerais de avaliação |
| `/pecas` | Seletor didático de sistemas e explorador da foto de arquivo Tector |
| `/desempenho` | Eficiência, eficácia, efetividade e simulador educativo |
| `/modelos` | Catálogo publicado, filtros e fichas de modelo com fontes |
| `/experiencia` | Percurso didático e quiz individual opcional validado pelo servidor |
| `/fontes` | Ledger de fontes, créditos, referências e transparência editorial |

## Funcionalidades e limites

A navegação por rota indica a página atual e funciona por toque e teclado. Há linha do tempo filtrável, etapas de qualidade, seletor de componentes, hotspots limitados ao que é visível na fotografia, fichas de modelos em diálogo, filtros de família, simulador didático e prática de quiz. O simulador não calcula consumo nem desempenho real. A resposta do quiz é conferida pelo servidor; seu resultado é somente da sessão e não cria pontuação. Não há evento, cadastro de participantes ou ranking ativo.

O catálogo contém quatro modelos/fichas publicados no D1. Não existe matriz de comparação de desempenho: os dados disponíveis não oferecem um conjunto de medições com versão, mercado, unidade, condições e método suficientemente equivalentes. Valores não são comparados artificialmente e preços não são estimados.

O painel oferece CRUD persistente no D1 para conteúdo, marcos, modelos, especificações, fontes, hotspots, mídia, atividades e configurações; a ingestão autorizada de imagens grava arquivos no R2. Um registro em `Páginas e conteúdo` com `slug` igual à rota pública publica um bloco editorial naquela página. Para substituir texto de componente, use os slugs `pecas-engine`, `pecas-transmission`, `pecas-driveline`, `pecas-brakes`, `pecas-axles`, `pecas-wheels`, `pecas-cab` ou `pecas-fuel`. Hotspots são editados separadamente. Esses campos são conteúdo educativo com fallback explícito, não cadastro de fitment ou de fornecedor.

O painel utiliza Cloudflare Access com One-time PIN e validação de identidade. Sem sessão, o host redireciona à tela de autenticação. O recebimento do PIN e uma sessão autenticada de CRUD ainda precisam ser confirmados pela pessoa autorizada, que tem acesso à caixa de e-mail cadastrada; não há senha embutida no site.

Não foi identificado vídeo autorizado entre os ativos do projeto. A abertura usa uma fotografia estática licenciada do IVECO S-Way como alternativa, com crédito e licença no site; a imagem não indica endosso. A área Peças identifica a foto do Tector da Fenatran 2017 como exemplo de arquivo substituível, não como configuração atual nem veículo do evento.

## Verificação

`npm run check` conclui build e checagens sintáticas do Worker, do site e do painel. Playwright verificou as oito rotas publicadas, quatro larguras responsivas, navegação, filtros, fichas, linha do tempo, seletor, simulador e quiz sem registrar pontuações. Os detalhes estão no [relatório de QA](docs/qa-report.md), com [captura de produção — desktop](docs/qa/published-home-desktop.png) e [captura de produção — celular](docs/qa/published-home-mobile.png).

## Fontes e projeto

- Relatório de **exatamente 20 referências de colaboração**: [`references/referencias-20.md`](references/referencias-20.md).
- [Síntese de redesign](docs/redesign-research.md), [apuração factual e licenças](docs/research-notes.md) e [inventário Cloudflare](docs/cloudflare-resources.md).
- [Mapa e instruções de edição](docs/mapa-e-instrucoes.md) e [créditos completos das imagens](assets/licenses.md).
- Pacote-fonte: `Rota-Vetor-Cloudflare-source.zip`.

## Estrutura e build

- `src/index.html` é o shell comum; `src/pages/` contém os oito fragmentos de rota.
- `src/styles/*.css` (concatenados em ordem em `dist/site/styles.css`) e `src/js/*.js` (concatenados em `dist/site/app.js`) mantêm a identidade visual e as interações. Cada módulo JS registra `onInit`/`onData`; `99-init.js` carrega `/api/public/site`.
- `scripts/preview/server.mjs` executa o Worker real com D1/R2 simulados (fixtures só para desenvolvimento): `PORT=8787 node scripts/preview/server.mjs`.
- Vídeo de abertura opcional: defina `hero_video_key` (e `hero_video_poster_key`) em `site_settings` com um vídeo mp4/webm enviado pelo painel, com alt, crédito e licença. Sem isso, a home usa a fotografia licenciada.
- `worker/index.js`: entrega de páginas, APIs, autenticação administrativa e acesso ao D1/R2.
- `migrations/0001_schema.sql`: esquema existente; os novos textos por rota/componentes usam `content_pages`, sem tabela nova.
- `scripts/build.mjs`, `package.json` e `wrangler.jsonc`: build e bindings do projeto.
- `public/assets/optimized/`: variantes WebP licenciadas incluídas no R2.

Para reconstruir: instale dependências com `npm install` e execute `npm run check`. Não inclua credenciais, códigos OTP ou segredos no pacote ou no navegador.
