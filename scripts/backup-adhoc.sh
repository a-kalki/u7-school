#!/usr/bin/env bash
# ═══ Ad-hoc бэкап u7-school («на всякий случай») ═══
#
# Копирует указанные файлы/каталоги в data/backup-adhoc/<UTC-время>-<причина>/.
# Это НЕ системный бэкап: он не участвует в ротации, offsite-вывозе и
# fingerprint оркестратора (те работают только с data/backup/). Нужен для
# ручных копий перед рискованными правками данных.
#
# Использование:
#   bash scripts/backup-adhoc.sh <причина> <путь> [<путь> ...]
#   bash scripts/backup-adhoc.sh --courses <причина>
#
# Примеры:
#   bash scripts/backup-adhoc.sh before-module-renumber data/courses
#   bash scripts/backup-adhoc.sh --courses before-content-edit
#
# Переопределить хранилище: ADHOC_BACKUP_DIR=<каталог> bash scripts/backup-adhoc.sh ...
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

ADHOC_DIR="${ADHOC_BACKUP_DIR:-data/backup-adhoc}"

usage() {
  sed -n '3,16p' "$0" | sed 's/^# \{0,1\}//'
}

if [ "$#" -lt 2 ]; then
  usage
  exit 1
fi

COURSES=0
if [ "$1" = "--courses" ]; then
  COURSES=1
  shift
  if [ "$#" -lt 1 ]; then
    usage
    exit 1
  fi
fi

REASON="$1"
shift

if [ "$COURSES" -eq 0 ] && [ "$#" -eq 0 ]; then
  echo "Нужен хотя бы один путь для копирования." >&2
  usage
  exit 1
fi

if [ "$COURSES" -eq 1 ]; then
  set -- data/courses/courses.json data/courses/modules.json \
         data/courses/lessons.json data/courses/steps.json
fi

SAFE_REASON="$(printf '%s' "$REASON" | tr -c '[:alnum:]-_' '-')"
STAMP="$(date -u +%Y-%m-%dT%H%M%SZ)"
DEST="${ADHOC_DIR}/${STAMP}-${SAFE_REASON}"

mkdir -p "$DEST"
for src in "$@"; do
  rel="${src#./}"
  if [ ! -e "$rel" ]; then
    echo "⚠ пропуск (нет пути): $rel" >&2
    continue
  fi
  mkdir -p "$DEST/$(dirname "$rel")"
  cp -a "$rel" "$DEST/$(dirname "$rel")/"
done

{
  echo "timestamp:  $STAMP"
  echo "reason:     $REASON"
  echo "git_commit: $(git rev-parse --short HEAD 2>/dev/null || echo '-')"
  echo "git_branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '-')"
} > "$DEST/meta.txt"

echo "✅ ad-hoc снимок: $DEST"
