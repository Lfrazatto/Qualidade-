#!/usr/bin/env bash
# Publica o site: envia dist/ ao R2 e reimplanta os dois Workers.
# Uso (na pasta do projeto, com `npx wrangler login` já feito):  bash scripts/publish.sh
set -euo pipefail
BUCKET=iveco-cummins-media
npm install --no-audit --no-fund
npm run check
ctype() { case "$1" in
  *.html) echo "text/html; charset=utf-8";; *.css) echo "text/css; charset=utf-8";; *.js|*.mjs) echo "text/javascript; charset=utf-8";;
  *.json) echo "application/json";; *.woff) echo "font/woff";; *.webp) echo "image/webp";; *.svg) echo "image/svg+xml";;
  *.mp4) echo "video/mp4";; *.webm) echo "video/webm";; *) echo "application/octet-stream";; esac; }
put() { echo "→ $2"; npx wrangler r2 object put "$BUCKET/$2" --file "$1" --content-type "$(ctype "$1")" --remote >/dev/null; }
# 1) arquivos estáticos e mídia primeiro
while IFS= read -r f; do put "$f" "site/${f#dist/site/}"; done < <(find dist/site -type f | sort)
while IFS= read -r f; do put "$f" "media/${f#dist/media/}"; done < <(find dist/media -type f | sort)
# 2) depois os Workers (site público e painel)
npx wrangler deploy
npx wrangler deploy --env admin
echo "Publicado. Confira: https://iveco-cummins-performance.lmpfrazatto.workers.dev/"
