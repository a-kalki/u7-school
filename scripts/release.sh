#!/usr/bin/env bash
# ═══ Релиз u7-school (запускается ЛОКАЛЬНО, на машине разработчика) ═══
#
# Использование:
#   bash scripts/release.sh 0.1.0 "bot-ui: Диалог и Экран, персистентность сессий"
#   bash scripts/release.sh 0.1.1 "хотфикс" --no-changelog
#
# Что делает:
#   1. Гейты: формат версии, ветка main, чистое дерево, синхронизация с origin
#   2. bun run check — не релизим красное
#   3. Проверяет секцию [X.Y.Z] в CHANGELOG.md (кроме --no-changelog)
#   4. Ставит версию в package.json
#   5. Коммит chore(release): vX.Y.Z + аннотированный тег vX.Y.Z
#   6. git push origin main --follow-tags
#
# Перед запуском: добавь секцию новой версии в CHANGELOG.md и закоммить её.
# После запуска: на сервере — bash scripts/deploy.sh <эта же версия>.
#
# Отмена ДО пуша: git tag -d vX.Y.Z && git reset --soft HEAD~1

set -euo pipefail

main() {
  local version="${1:-}"
  local description="${2:-}"
  local flag="${3:-}"

  # ── Валидация аргументов ──
  if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ Укажи версию в формате X.Y.Z: bash scripts/release.sh 0.1.0 \"описание релиза\""
    exit 1
  fi
  if [[ "$flag" != "" && "$flag" != "--no-changelog" ]]; then
    echo "❌ Неизвестный флаг: $flag (допускается только --no-changelog)"
    exit 1
  fi

  local tag="v${version}"

  # ── Гейт 1: ветка main ──
  local branch
  branch="$(git rev-parse --abbrev-ref HEAD)"
  if [ "$branch" != "main" ]; then
    echo "❌ Релиз делается из main (сейчас: ${branch})."
    exit 1
  fi

  # ── Гейт 2: чистое рабочее дерево ──
  if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Есть незакоммиченные изменения — закоммить или убери:"
    git status --short
    exit 1
  fi

  # ── Гейт 3: синхронизация с origin ──
  # Локальный main может опережать origin (обычные коммиты уйдут вместе с
  # релизным пушем), но отставать — нельзя: тег попадёт на устаревший код.
  echo "▶ git fetch origin"
  git fetch origin --quiet
  if ! git merge-base --is-ancestor origin/main HEAD; then
    echo "❌ origin/main содержит коммиты, которых нет локально. Сделай git pull --ff-only и повтори."
    exit 1
  fi

  # ── Гейт 4: тег ещё не существует ──
  if git rev-parse -q --verify "refs/tags/${tag}" >/dev/null; then
    echo "❌ Тег ${tag} уже существует."
    exit 1
  fi

  # ── Гейт 5: CHANGELOG ──
  if [ "$flag" != "--no-changelog" ]; then
    if ! grep -q "^## \[${version}\]" CHANGELOG.md; then
      echo "❌ В CHANGELOG.md нет секции «## [${version}]»."
      echo "   Добавь запись (Added/Changed/Fixed/Migration), закоммить и запусти снова."
      echo "   Для хотфиксов без записи: bash scripts/release.sh ${version} \"описание\" --no-changelog"
      exit 1
    fi
  fi

  # ── Гейт 6: полный чек ──
  echo "▶ bun run check (lint + tsc + тесты)"
  bun run check

  # ── Bump версии в package.json ──
  echo "▶ Обновляю версию в package.json → ${version}"
  VERSION="$version" bun -e '
    const file = "package.json";
    const pkg = await Bun.file(file).json();
    if (pkg.version !== process.env.VERSION) {
      pkg.version = process.env.VERSION;
      await Bun.write(file, JSON.stringify(pkg, null, 2) + "\n");
    }
  '

  # ── Коммит релиза (если есть что коммитить) ──
  git add package.json CHANGELOG.md
  if ! git diff --cached --quiet; then
    git commit --quiet -m "chore(release): ${tag}"
    echo "▶ Коммит: chore(release): ${tag}"
  fi

  # ── Аннотированный тег ──
  if [ -z "$description" ]; then
    description="Release ${tag}"
    echo "⚠️  Описание не задано, в тег пойдёт «${description}»."
  fi
  git tag -a "$tag" -m "$description"
  echo "▶ Тег: ${tag} — ${description}"

  # ── Пуш ──
  echo "▶ git push origin main --follow-tags"
  git push origin main --follow-tags

  echo ""
  echo "✅ Релиз ${tag} опубликован."
  echo "   Далее на сервере: bash scripts/deploy.sh ${version}"
}

# main вызывается последней строкой: к этому моменту bash уже дочитал весь
# файл в память — важно для скриптов, которые меняют собственный файл на диске.
main "$@"
