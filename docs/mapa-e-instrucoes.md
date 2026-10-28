# Mapa do site e instruções de manutenção

## Endereços e navegação

- **Site público:** <https://iveco-cummins-performance.lmpfrazatto.workers.dev/>
- **Painel protegido:** <https://iveco-cummins-performance-admin.lmpfrazatto.workers.dev/admin>
- **Manifesto de rotas:** `public/manus-routes.json` e `/manus-routes.json`.

O menu conduz a páginas próprias, não a âncoras dentro da home. Rotas diretas: `/`, `/historia`, `/qualidade`, `/pecas`, `/desempenho`, `/modelos`, `/experiencia` e `/fontes`. Cada rota tem título próprio, indica `aria-current="page"`, funciona em recarga e tem layout adaptado a desktop, tablet e celular. O botão do menu móvel fecha ao navegar e com Escape.

| Página | Conteúdo e interação |
|---|---|
| Início | Foto estática do S-Way, manifesto curto, caminhos para qualidade, modelos e história. Não há vídeo autorizado publicado; os créditos da imagem aparecem na página. |
| História | Histórias institucionais separadas e linha do tempo filtrável; a EEA de 1996–2008 é apresentada como colaboração encerrada, não prova de parceria atual. |
| Qualidade | Cinco etapas interativas mais dez dimensões gerais: materiais; peças; precisão/acabamento; inspeção/controle; montagem/integração; durabilidade/confiabilidade; manutenção/suporte; segurança; adequação à missão; consistência. Não é auditoria nem descrição de processos de marca. |
| Peças | Seletor Motor, Transmissão, Trem de força, Freios, Eixos, Rodas e pneus, Cabine e Alimentação. As funções genéricas são separadas de fornecedor e configuração. Três hotspots da foto descrevem somente regiões externas visíveis. |
| Desempenho | Diferencia eficiência, eficácia e efetividade; simulador com parâmetros didáticos em navegador, sem estimativa técnica ou consumo real. |
| Modelos | Quatro registros/fichas D1, filtros por categoria, variantes publicadas e detalhes em diálogo. Não se estima preço nem se compara desempenho com bases incompatíveis. |
| Experiência | Percurso em quatro etapas e quiz opcional de prática individual. Respostas são validadas no servidor; não há placar nem pontuação persistida. A exploração do caminhão, linha do tempo e simulador têm rotas próprias. |
| Fontes | Ledger D1 com datas de publicação e consulta/atualização, conteúdo editorial independente, atribuições de mídia, limites das afirmações e transparência. O relatório à parte contém exatamente 20 referências comerciais pesquisadas. |

## O que pode ser editado no painel

Acesso administrativo é protegido por Cloudflare Access/One-time PIN, além da checagem de identidade no Worker. O estado sem sessão redireciona para Access. O PIN e uma gravação CRUD autenticada não foram testados: dependem da caixa da identidade autorizada. Não há senha incluída no código.

O painel grava no D1 por sua API autenticada. As coleções reais incluem `content_pages`, `timeline_events`, `truck_models`, `model_specs`, `sources`, `truck_hotspots`, `media_assets`, `games`, `quiz_questions`, `events`, `participants`, `scores`, `site_settings` e o registro de auditoria. Arquivos de imagem autorizados são enviados ao R2 e acompanhados por texto alternativo, legenda, autor, licença e fonte.

Em **Páginas e conteúdo**:

1. Para colocar um bloco editorial em uma rota, use o `slug` igual ao caminho sem barras: `home`, `historia`, `qualidade`, `pecas`, `desempenho`, `modelos`, `experiencia` ou `fontes`.
2. Para substituir título/explicação de uma opção do seletor de componentes, use `pecas-engine`, `pecas-transmission`, `pecas-driveline`, `pecas-brakes`, `pecas-axles`, `pecas-wheels`, `pecas-cab` ou `pecas-fuel`. O texto aparece no painel selecionado; funções sem registro publicado mantêm o conteúdo educativo local. Isso não atribui fabricante nem compatibilidade a uma peça.
3. `title`, `kicker`, `body_markdown` e `status=published` controlam o bloco. Um slug publicado para rota/componente não é repetido na lista geral de Fontes; conteúdo editorial independente continua na lista de Fontes.
4. A referência geral de contexto do componente permanece separada. Para alterar hotspots, use **Pontos interativos**, com coordenadas percentuais relativas à imagem e explicações sustentadas por fonte.

Para conteúdo técnico, registre sempre modelo, versão/ano, mercado, unidade, condições e fonte primária. Não transfira potência, torque, consumo ou capacidade entre versões. Não atribua fitment, processo fabril, certificação ou fornecedor sem fonte para a versão/unidade específica. Preço só deve ser exibido com fonte atual, versão, região, moeda e data.

## Mídia e substituição do veículo

A foto do explorador é de um IVECO Tector de 8 toneladas exposto na Fenatran 2017. É imagem de arquivo para leitura visual externa, não registro de fábrica nem ficha técnica atual. A foto principal é um IVECO S-Way da IAA 2024. Cada arquivo e variante WebP está associado à atribuição e licença listadas em [`assets/licenses.md`](../assets/licenses.md) e [`research-notes.md`](research-notes.md).

Para trocar uma mídia:

1. Faça login autorizado no painel, envie JPEG/PNG/WebP permitido para R2 e registre alt text, legenda, autor, licença e URL do original.
2. Cadastre ou edite `media_assets` com a chave R2; em `site_settings`, configure `hero_image_key` ou `explorer_image_key` para a chave correta.
3. Para imagem nova de explorador, reposicione os hotspots com `x_pct`/`y_pct` e revise cada afirmação técnica. Mantenha como “provisório” até receber modelo definitivo e material autorizado.
4. O hero atual usa imagem estática: não foi identificado vídeo de caminhão/operação com autorização documentada para o site. A versão publicada mantém a alternativa estática e movimentos curtos respeitam `prefers-reduced-motion`.

## Quiz, atividades e dados

O quiz publicado contém quatro perguntas rastreáveis e é prática individual. A API verifica a alternativa no servidor sem revelar a chave correta ao carregar; a tentativa fica apenas no estado da página. Não há evento ativo, pseudônimos, participantes, score persistido ou ranking.

A coleção de jogos habilita somente as funções implementadas. Um slug novo não cria lógica. Não habilite `accept_scores` ou leaderboard até ter evento real, datas, finalidade, aviso/consentimento, retenção e responsável. A comparação técnica entre famílias não é apresentada porque não há medições com condições, unidade, versão e método suficientemente equivalentes; o catálogo fornece fichas individuais.

## Fontes e QA

A apuração histórica, a aquisição da Meritor e a referência sobre Osasco estão em [`research-notes.md`](research-notes.md). A análise das 20 páginas está em [`../references/referencias-20.md`](../references/referencias-20.md). Resultados de build, Playwright, axe-core, hash e screenshots estão em [`qa-report.md`](qa-report.md).
