# Referência de API Cloudflare usada no deploy

Consultado em 2026-10-22 por meio do schema OpenAPI da API Cloudflare disponibilizado pelo conector Cloudflare autorizado. A API base é `https://api.cloudflare.com/client/v4`.

- **D1:** `GET /accounts/{account_id}/d1/database` lista bancos; `POST /accounts/{account_id}/d1/database/{database_id}/query` executa SQL; `/import` e `/export` tratam arquivos SQL. O projeto usa o banco `iveco-cummins-content`.
- **R2:** `GET /accounts/{account_id}/r2/buckets` lista buckets; `GET /accounts/{account_id}/r2/buckets/{bucket_name}/objects` lista chaves; `PUT /accounts/{account_id}/r2/buckets/{bucket_name}/objects/{object_key}` envia um objeto; `GET` e `DELETE` atuam sobre a chave exata. O projeto usa o bucket `iveco-cummins-media`.
- **Workers:** `GET /accounts/{account_id}/workers/scripts/{script_name}` baixa um Worker; `PUT` no mesmo caminho envia um módulo; `/content` e `/content/v2` dão acesso ao conteúdo; `/deployments` lista e cria deployments; `/subdomain` controla o subdomínio `workers.dev`.
- **Acesso Zero Trust:** a API também lista aplicações em `/accounts/{account_id}/access/apps` e suas políticas. A configuração atual da rota `/admin` já está documentada no projeto; não foi alterada nesta etapa.

A busca do schema identificou as operações e os métodos acima. Para executar chamadas, o executor Cloudflare do MCP recebe `account_id` explicitamente quando a sessão tem mais de uma conta autorizada; caso contrário, pode usar a conta única da sessão.

## Fontes

- [Cloudflare API documentation](https://developers.cloudflare.com/api/)
- Schema OpenAPI retornado pelo conector Cloudflare ao consultar as rotas de D1, R2 e Workers em 2026-10-22.
