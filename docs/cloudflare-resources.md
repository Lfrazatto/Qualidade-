# Recursos Cloudflare do projeto

Recursos criados em 22 de outubro de 2026 após autorização para publicar o projeto separadamente. A versão multipágina de qualidade foi concluída em 25 de outubro de 2026. Não há domínio personalizado.

| Recurso | Identificador | Estado verificado |
|---|---|---|
| Worker público | `iveco-cummins-performance` | Serve a home, sete rotas editoriais e APIs públicas em `https://iveco-cummins-performance.lmpfrazatto.workers.dev/`. |
| Worker administrativo | `iveco-cummins-performance-admin` | Host próprio, `/admin`, protegido por Cloudflare Access e validação de identidade pelo Worker. |
| D1 | `iveco-cummins-content` — `e6a23607-9a67-4e09-8ab5-d26392603c2a` | Conteúdo persistente, fontes, marcos, catálogo, especificações, hotspot, conteúdo editorial, quiz/atividade e configuração. |
| R2 | `iveco-cummins-media` | 16 variantes/ativos WebP licenciados mais HTML, JS, CSS, manifesto e arquivos do painel; acesso via Worker, sem bucket público. |
| Zero Trust / Access | Aplicação `IVECO Cummins Site Admin Access` | Login One-time PIN no host administrativo. Nenhuma política global foi alterada. |
| Hosts | `lmpfrazatto.workers.dev` | `workers.dev` habilitado para estes Workers. DNS SIPAT não foi alterado. |

## Rotas e publicação

A allowlist publicada contém oito documentos diretos: `/`, `/historia`, `/qualidade`, `/pecas`, `/desempenho`, `/modelos`, `/experiencia` e `/fontes`. `/manus-routes.json` informa oito rotas; caminhos desconhecidos não servem silenciosamente a home. `/api/public/site` lê o conteúdo publicado em D1 e as chaves de mídia em R2.

Build final: `npm run check` criou oito documentos HTML, os ativos estáticos e as 16 imagens otimizadas. O Playwright carregou as oito rotas publicadas, percorreu interações e reportou zero erros JavaScript/de rede. As páginas, CSS, JS e manifesto público foram baixados e comparados por SHA-256 com os artefatos locais sem discrepâncias. O HTML administrativo em R2 também corresponde ao build local, hash `8674cd8a92664040584618cf512ba82d25c72c9d48867d9fbd9bc65f6316ab94`.

Verificação final de 25 de outubro de 2026: após o ajuste do ledger de Fontes, `npm run check` passou; o objeto `site/app.js` no bucket `iveco-cummins-media` e a resposta pública `/app.js` retornaram SHA-256 `bdb34df1412076640e06a8f326b659922983155c1a65c201e8c91dbf7c6d67b5` (50.105 bytes). O browser confirmou nove fichas com datas de consulta visíveis. A sincronização foi limitada a esse objeto R2; nenhum Worker, D1, rota ou configuração foi alterado.

## Estado dos dados e privacidade

Na consulta pública final, D1 serviu quatro modelos, nove marcos, doze especificações, nove fontes, três hotspots, duas experiências e quatro perguntas de prática; existia um bloco editorial independente e nenhum evento pontuado. O quiz é prática individual, validada pelo Worker e sem score persistente. O simulador é didático, executado no navegador, e não estima dados reais.

O painel pode editar conteúdo por rota usando registros `content_pages` com slugs iguais às rotas e explicações de componentes por slugs `pecas-*`. Hotspots, modelos, especificações, fontes e mídia permanecem em suas coleções reais no D1. Uma resposta do quiz foi testada contra a API publicada; não foi enviado POST para pontuação.

Sem sessão administrativa, o host respondeu HTTP 302 redirecionando à tela de login Cloudflare Access. O fluxo de One-time PIN e uma alteração CRUD autenticada ainda exigem a caixa da identidade autorizada; não foram declarados como verificados.

Os importadores temporários empregados para upload foram apagados após a verificação; seus subdomínios `workers.dev` e a chave staging de R2 também foram removidos. Nenhuma rota transitória de ingestão permanece.

## Isolamento e configuração

Os Workers `projeto-sipat` e `sipat-cummins-2026`, `www.sipatcummins.com`, DNS SIPAT, D1 `sipat-cummins-db` e bucket `sipat-cummins-assets` foram preservados. Não foram alterados recursos fora do projeto IVECO/Cummins nem configurado domínio personalizado.
