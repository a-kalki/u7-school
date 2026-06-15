#!/usr/bin/env bash
# Использование:
#   ./scripts/add-debrief.sh <дата> <трек> <коммит> <skill> <итог> <лог-файл>
#
# Пример:
#   ./scripts/add-debrief.sh 2026-06-14 stream-p1 abc1234 post-task-debrief "3/3 ✓" debrief-logs/2026-06-14-stream-p1.md

set -euo pipefail

DATE="$1"
TRACK="$2"
COMMIT="$3"
SKILL="$4"
RESULT="$5"
LOGFILE="$6"

REGISTRY="data/debrief/registry.md"

# Определяем следующий номер
LAST_NUM=$(grep -oP '^\|\s*\K\d+' "$REGISTRY" | tail -1)
NEXT_NUM=$((LAST_NUM + 1))

# Добавляем строку в конец таблицы (перед строкой "**Всего:**")
ROW="| $NEXT_NUM | $DATE | $TRACK | $COMMIT | $SKILL | $RESULT | [лог]($LOGFILE) |"
# Если последняя строка таблицы непустая, добавляем новую строку после неё
sed -i "/^\*\*Всего:\*\*/i $ROW" "$REGISTRY"

# Обновляем счётчик
sed -i "s/^\*\*Всего:\*\* .*/**Всего:** $NEXT_NUM/" "$REGISTRY"

echo "Добавлена запись №$NEXT_NUM в $REGISTRY"
