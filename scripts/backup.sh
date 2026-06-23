#!/usr/bin/env bash
# ═══ Скрипт бекапа данных потока ═══
# 
# Создаёт копию важных файлов в data/backup/<timestamp>-<reason>/
#
# Использование:
#   bash scripts/backup.sh planned        — плановый бекап
#   bash scripts/backup.sh before-pull    — перед git pull
#
# Копируемые файлы:
#   data/users/users.json
#   data/users/seed.json
#   data/questionnaires/questionnaires.json
#   data/streams/streams.json
#   data/streams/students.json

set -euo pipefail

REASON="${1:-}"
if [ -z "$REASON" ]; then
  echo "❌ Укажи причину бекапа: planned | before-pull"
  echo "   Пример: bash scripts/backup.sh planned"
  exit 1
fi

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
DEST="data/backup/${TIMESTAMP}-${REASON}"

mkdir -p "${DEST}/questionnaires"
mkdir -p "${DEST}/users"
mkdir -p "${DEST}/streams"

cp data/users/users.json           "${DEST}/users/"
cp data/users/seed.json            "${DEST}/users/"
cp data/questionnaires/questionnaires.json "${DEST}/questionnaires/"
cp data/streams/streams.json       "${DEST}/streams/"
cp data/streams/students.json      "${DEST}/streams/"

echo "✅ Бекап создан: ${DEST}"
