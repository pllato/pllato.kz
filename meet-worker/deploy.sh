#!/usr/bin/env bash
# Деплой сигналинг-воркера Pllato Meet.
# Запуск:  cd meet-worker && ./deploy.sh   (или: bash deploy.sh)
#
# Флаг --config обязателен: на этой машине рядом лежит «перенаправляющий»
# конфиг Cloudflare, из-за которого обычный `wrangler deploy` цепляет
# чужой воркер. --config жёстко указывает наш wrangler.toml.
set -e
cd "$(dirname "$0")"
# создаём R2-бакет для архива (если ещё нет — иначе тихо пропускаем)
WRANGLER_CONFIG= npx wrangler r2 bucket create pllato-meet-archive 2>/dev/null || true
WRANGLER_CONFIG= npx wrangler deploy --config ./wrangler.toml
echo
echo "Проверка: curl https://pllato-meet.uurraa.workers.dev/health"
