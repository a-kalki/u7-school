#!/usr/bin/env bash
# Обслуживание реестра дебрифингов.
# Выводит рекомендации: graduation skills, темы с пробелами, кандидаты на повтор.
#
# Использование: ./scripts/maintenance-debrief.sh

set -euo pipefail

REGISTRY="data/debrief/registry.md"

if [ ! -f "$REGISTRY" ]; then
  echo "Реестр не найден: $REGISTRY"
  exit 1
fi

TOTAL=$(grep -oP '^\*\*Всего:\*\*\s*\K\d+' "$REGISTRY" || echo 0)

echo "=== Обслуживание реестра дебрифингов ==="
echo "Всего записей: $TOTAL"
echo ""

# Статистика по skills
echo "--- По skills ---"
grep -oP '\| \d+ \| [^|]+ \| [^|]+ \| [^|]+ \| \K[^|]+' "$REGISTRY" | \
  sed 's/^ *//;s/ *$//' | sort | uniq -c | sort -rn

echo ""

# Статистика по итогам (⚠ и ✗)
echo "--- Проблемные записи (⚠ или ✗) ---"
grep -P '\|.*[⚠✗]' "$REGISTRY" || echo "Нет проблемных записей."

echo ""

# Проверка graduation: для каждого skill >5 записей и все ✓
echo "--- Graduation check ---"
SKILLS=$(grep -oP '\| \d+ \| [^|]+ \| [^|]+ \| [^|]+ \| \K[^|]+' "$REGISTRY" | \
  sed 's/^ *//;s/ *$//' | sort -u)

for skill in $SKILLS; do
  TOTAL_SKILL=$(grep -c "| $skill " "$REGISTRY" || true)
  OK_COUNT=$(grep -c "| $skill .*✓" "$REGISTRY" || true)
  if [ "$TOTAL_SKILL" -ge 5 ] && [ "$TOTAL_SKILL" -eq "$OK_COUNT" ]; then
    echo "🎓 $skill: $OK_COUNT/$TOTAL_SKILL ✓ — кандидат на graduation"
  fi
done

# Триггер ревизии каждые 10 записей
if [ $((TOTAL % 10)) -eq 0 ] && [ "$TOTAL" -gt 0 ]; then
  echo ""
  echo "📊 Триггер ревизии: $TOTAL записей (кратно 10)"
  echo "   Проверь таблицу на темы с ⚠ — возможно, нужен новый skill или углубление."
fi
