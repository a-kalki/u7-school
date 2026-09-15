#!/usr/bin/env bash
# ═══ Скрипт бэкапа данных u7-school-bot ═══
#
# Копирует все JSON-хранилища в data/backup/<timestamp>-<reason>/ и пишет
# туда же meta.txt: версия пакета, ближайший git-тег, SHA коммита, ветка.
# Благодаря meta.txt каждый бэкап однозначно сопоставляется с версией кода —
# откат делается парой «бэкап + checkout тега» (см. scripts/deploy.sh).
#
# Использование:
#   bash scripts/backup.sh planned           — плановый бэкап
#   bash scripts/backup.sh before-deploy     — перед деплоем новой версии
#   bash scripts/backup.sh before-rollback   — перед откатом на старый тег
#   bash scripts/backup.sh before-migration  — перед миграцией данных
#
# Копируемые файлы (отсутствующие пропускаются с предупреждением):
#   users:          users.json, seed.json
#   questionnaires: questionnaires.json (движок questionnaire)
#   wish:           wishes.json
#   jobs:           last-runs.json (состояние планировщика)
#   streams:        streams.json, students.json
#   courses:        courses.json, modules.json, lessons.json, steps.json
#   bot:            bot/sessions.json, bot/short-ids.json (сессии и shortId-мапа)

set -euo pipefail

REASON="${1:-}"
if [ -z "$REASON" ]; then
  echo "❌ Укажи причину бэкапа: planned | before-deploy | before-rollback | before-migration"
  echo "   Пример: bash scripts/backup.sh planned"
  exit 1
fi

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
DEST="data/backup/${TIMESTAMP}-${REASON}"

FILES=(
  "users/users.json"
  "users/seed.json"
  "questionnaires/questionnaires.json"
  "wish/wishes.json"
  "jobs/last-runs.json"
  "streams/streams.json"
  "streams/students.json"
  "courses/courses.json"
  "courses/modules.json"
  "courses/lessons.json"
  "courses/steps.json"
  "bot/sessions.json"
  "bot/short-ids.json"
)

copied=0
for rel in "${FILES[@]}"; do
  if [ -f "data/${rel}" ]; then
    mkdir -p "${DEST}/$(dirname "${rel}")"
    cp "data/${rel}" "${DEST}/${rel}"
    copied=$((copied + 1))
  else
    echo "⚠️  Пропущен (нет файла): data/${rel}"
  fi
done

# ── Метаданные: какая версия кода соответствует этому бэкапу ──
# git_tag — ближайший тег ИЗ КОТОРОГО собран текущий код; точную позицию
# даёт git_commit. Если git/bun недоступны — не мешаем бэкапу.
VERSION="$(bun -e 'const p = await Bun.file("package.json").json(); console.log(p.version ?? "unknown")' 2>/dev/null || echo "unknown")"
GIT_TAG="$(git describe --tags --abbrev=0 2>/dev/null || echo "нет")"
GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"
GIT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"

{
  echo "timestamp:  ${TIMESTAMP}"
  echo "reason:     ${REASON}"
  echo "version:    ${VERSION}"
  echo "git_tag:    ${GIT_TAG} (ближайший тег на момент бэкапа)"
  echo "git_commit: ${GIT_COMMIT}"
  echo "git_branch: ${GIT_BRANCH}"
} > "${DEST}/meta.txt"

echo "✅ Бэкап создан: ${DEST} (файлов: ${copied}/${#FILES[@]})"
echo "   Версия кода: ${VERSION} (тег: ${GIT_TAG}, коммит: ${GIT_COMMIT})"
