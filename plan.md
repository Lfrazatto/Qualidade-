# Plano de reformulação — Rota / Vetor: qualidade e performance

## Objetivo e decisões

Reformular o site existente como uma experiência editorial em português brasileiro sobre **qualidade e performance em caminhões**, com páginas navegáveis por rotas próprias. Preservar a aplicação real já implantada — Workers, D1, R2, Access, conteúdo persistente e painel administrativo — e reutilizar fontes, fotografias licenciadas e interações válidas. Não criar um mockup desconectado, não trocar recursos Cloudflare e não declarar relação comercial atual IVECO–Cummins.

A navegação pública terá oito documentos roteáveis: `/` (Início), `/historia`, `/qualidade`, `/pecas`, `/desempenho`, `/modelos`, `/experiencia` e `/fontes`. Cada rota será gerada por um fragmento editorial específico dentro de um shell comum; links serão caminhos absolutos sem âncoras usadas como substituto de página. O Worker servirá HTML distinto por uma tabela fechada de rotas para suportar link direto, atualização e botão voltar/avançar do navegador; APIs, mídia e host administrativo permanecem em seus caminhos atuais.

## Arquitetura atual preservada

A aplicação é HTML/CSS/JavaScript nativos. `scripts/build.mjs` compila o shell e fragmentos em `dist/site`; `worker/index.js` serve os arquivos estáticos, API pública, mídia R2 e painel/API administrativa em host separado. D1 contém `content_pages`, timeline, modelos, especificações, hotspots, fontes, jogos, quiz e registros privados de evento/pontuação. R2 guarda as imagens WebP e arquivos do site. A identidade administrativa é validada por Cloudflare Access e JWT no Worker. A estrutura atual não contém tabela de peças; dados educativos genéricos de componentes serão apresentados sem inferir fornecimento, montagem, versão ou fabricação.

Não alterar contas, domínio, identidade Access, políticas administrativas ou banco de dados de evento sem necessidade. Quando suficiente, conservar o esquema D1 e a API existente; ampliar as rotas públicas de leitura sem modificar CRUD. O painel continua limitado à autenticação real, e nenhum texto deve afirmar que o login ou edição autenticada foram testados caso não tenham sido.

## Rotas e conteúdos

- **Início `/`:** hero com fotografia IVECO licenciada já hospedada no R2; título direto sobre qualidade e performance; texto sobre produto, componentes, processos, inspeção, manutenção, segurança e missão; três chamadas para `/qualidade`, `/modelos` e `/historia`; nota discreta de projeto independente. Não existe vídeo autorizado registrado no projeto, portanto a entrada usa foto estática responsiva e créditos, sem autoplay.
- **História `/historia`:** separar marcos institucionais da IVECO de marcos Cummins; apresentar os marcos oficiais de 1975, 1996 e 2008 em fonte próxima; identificar a European Engine Alliance como relação histórica encerrada em 2008, sem inferir parceria presente nem associar início da aliança a Osasco. Preservar os outros marcos do D1 quando acompanhados por fontes.
- **Qualidade `/qualidade`:** página central com critérios educativos de material, componente, acabamento, inspeção, integração, durabilidade, manutenção, segurança, adequação à missão e consistência operacional. Distinguir conceito geral de fato específico da empresa; não atribuir certificação, teste, fornecedor, fábrica ou processo sem evidência. Utilizar percurso interativo de critérios, sem simular fábrica real.
- **Peças `/pecas`:** explorador responsivo com imagem provisória licenciada do Tector de arquivo e detalhes externos visíveis, combinado a um seletor didático de motor, transmissão, freios, eixos/rodas, cabine e alimentação. Descrições tratam de funções gerais de engenharia e dizem que configuração, peças instaladas e fornecedor dependem do modelo/versão; jamais inferir componentes internos da foto ou atribuir fornecimento a Cummins/Meritor/IVECO sem fonte de fitment.
- **Desempenho `/desempenho`:** manter as definições distintas de eficiência, eficácia e efetividade; transferir o simulador funcional, marcado como educativo e não técnico; explicitar que carga, rota, condução, manutenção, clima, especificação e método alteram resultados. Não gerar números de consumo nem recomendações.
- **Modelos `/modelos`:** reutilizar catálogo e conteúdo D1 com imagens, fontes, filtros por família, variantes, navegação por teclado e fichas em diálogo. Preservar mercado, ano e versão; sem preço sem confirmação pública e sem comparação não equivalente.
- **Experiência `/experiencia`:** percurso educativo de avaliação da qualidade, simulator ou atividades interativas adequadas e quiz opcional existente com resposta conferida no Worker. Manter sessão de prática sem cadastro/placar; nenhum evento ou participante fictício.
- **Fontes `/fontes`:** fontes do D1, as referências empresariais sintetizadas, créditos/licenças e nota de transparência independente. Fontes factuais próximas aos blocos correspondentes.

## Design

**Movimento:** editorial de qualidade industrial contemporânea, combinando fotografia de estrada e veículo com linguagem gráfica de inspeção e processo.

**Princípios:** qualidade é o eixo editorial; evidência e ressalva aparecem com a afirmação; cada rota tem propósito visual próprio; interações explicam em vez de mascarar falta de dado. A identidade do site é própria e independente.

**Cor:** carvão, branco, aço e vermelho profundo de destaque, combinado com tons neutros. A comunicação corporativa IVECO consultada em 2026 associa vermelho a veículos diesel/gás e azul a modelos elétricos; não publica um código cromático de interface nesse texto. Portanto, o vermelho deste site é uma cor **inspirada**, não declarada oficial, e não substitui o cinza metálico que a própria IVECO nomeia como sua cor-assinatura. Não usar logotipo de empresa ou composição que sugira aprovação.

**Layout:** navegação compacta comum e oito páginas objetivas; alternância de fundos claros e escuros; capítulos com fotografia grande, escalas/etiquetas inspiradas em inspeção, tarjetas assimétricas e leitura mobile em coluna. Evitar repetir landing-page e evitar grade uniforme em todas as páginas.

**Elementos de assinatura:** monograma R/V original; linha fina de fluxo/controle; índices editoriais e micro-rótulos de inspeção. **Interação:** seleção acessível de componente e de etapa; links diretos para fontes; menu ativo por rota. **Motion:** entrada curta própria a cada página, passo de inspeção por transformação de etapa e transições breves; nada essencial depende de movimento/hover. Respeitar `prefers-reduced-motion`; não usar vídeo sem ativo autorizado.

**Tipografia:** sistema sans nativo/inter para leitura, serif editorial em destaque e monoespaçada somente em metadados. **Voz:** objetiva, didática e cautelosa. Exemplos: “Qualidade aparece no caminho inteiro.” e “Função geral. Configuração depende do modelo.” **Essência da marca própria:** guia visual independente, preciso e explorável. Não usar R/V como se fosse logotipo IVECO/Cummins.

## Estrutura de arquivos

- `src/index.html`: shell HTML compartilhado, head, navegação responsiva, `<main>` e rodapé.
- `src/pages/*.html`: fragmentos de conteúdo exclusivos de cada rota; conteúdo sem script inline.
- `src/styles.css`: sistema visual vermelho-inspirado, temas, layout multipágina, componentes, responsividade e movimento reduzido.
- `src/app.js`: identificar rota, buscar dados da API pública, inicializar somente interações presentes, filtros/diálogos/timeline/hotspots/simulador/quiz e erros.
- `src/admin.html`, `src/admin.css`, `src/admin.js`: preservar o painel CRUD real com Access.
- `worker/index.js`: mapa allowlist de rotas HTML para objetos R2, mantendo intactas rotas APIs/mídias/admin.
- `scripts/build.mjs`: montar cada página com shell comum, copiar CSS/JS/admin/manifesto e imagens otimizadas ao diretório de release.
- `public/manus-routes.json`: lista canônica das oito rotas de página (excluir APIs, assets e `/admin`).
- `migrations/`: não alterar salvo necessidade real para conteúdo requerido.
- `docs/`, `references/`, `assets/licenses.md`: atualizar pesquisa de qualidade/cores, QA e instruções; preservar o relatório de exatamente 20 referências de colaboração.

## Publicação

Publicar a atualização somente nos dois Workers Cloudflare já autorizados, mantendo D1/R2 e políticas Access atuais. Sincronizar shell, oito documentos HTML, JS, CSS e manifesto aos objetos conhecidos de R2; publicar o Worker com mapa de rotas fechado. Testar acesso direto/refresh/navegação do browser nas oito rotas, dados D1 e interações sem criar score, mais viewport desktop/mobile e reduced motion. A entrega deve distinguir o que foi publicado do login OTP/CRUD que só pode ser comprovado com acesso ao e-mail autorizado.
