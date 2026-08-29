#!/usr/bin/env bash
# ═══ Скрипт бекапа данных потока ═══
#
# Создаёт копию всех файлов данных в data/backup/<timestamp>-<reason>/
#
# Использование:
#   bash scripts/backup.sh planned        — плановый бекап
#   bash scripts/backup.sh before-pull    — перед git pull
#   bash scripts/backup.sh before-migration — перед миграцией данных
#
# Копируемые файлы (отсутствующие пропускаются с предупреждением):
#   users:       users.json, seed.json
#   questionnaires: questionnaires.json (старый движок onboarding, архив),
#                   q-questionnaires.json (новый движок questionnaire)
#   wish:        wishes.json
#   jobs:        last-runs.json (состояние планировщика)
#   streams:     streams.json, students.json
#   courses:     courses.json, modules.json, lessons.json, steps.json

set -euo pipefail

REASON="${1:-}"
if [ -z "$REASON" ]; then
  echo "❌ Укажи причину бекапа: planned | before-pull | before-migration"
  echo "   Пример: bash scripts/backup.sh planned"
  exit 1
fi

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
DEST="data/backup/${TIMESTAMP}-${REASON}"

FILES=(
  "users/users.json"
  "users/seed.json"
  "questionnaires/questionnaires.json"
  "questionnaires/q-questionnaires.json"
  "wish/wishes.json"
  "jobs/last-runs.json"
  "streams/streams.json"
  "streams/students.json"
  "courses/courses.json"
  "courses/modules.json"
  "courses/lessons.json"
  "courses/steps.json"
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

echo "✅ Бекап создан: ${DEST} (файлов: ${copied}/${#FILES[@]})"
