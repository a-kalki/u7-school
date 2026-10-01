#!/usr/bin/env bash
# ═══ Скрипт бэкапа данных u7-school-bot (контракт v1) ═══
#
# Копирует JSON-хранилища из data/ в data/backup/<UTC-время>-<причина>/ и
# пишет manifest.json (тип, причина, git-версия, sha256 файлов, verify) плюс
# meta.txt для обратной совместимости с scripts/deploy.sh и README.
#
# Каждый снимок самодостаточен и самоописан. Подробности — docs/backup.md;
# общая система — ~/server-ops/docs/plans/backup-system.md.
#
# Коды возврата (контракт):
#   0  — снимок создан
#   10 — пропущено (данные не менялись с прошлого снимка)
#   1  — ошибка
#
# Использование:
#   bash scripts/backup.sh planned           — плановый (может пропустить)
#   bash scripts/backup.sh before-deploy     — перед деплоем (всегда снимок)
#   bash scripts/backup.sh before-rollback   — перед откатом
#   bash scripts/backup.sh before-migration  — перед миграцией
#   bash scripts/backup.sh --name=before-x   — именованный protected-снимок
#   bash scripts/backup.sh --list
#   bash scripts/backup.sh --prune
#   bash scripts/backup.sh --verify data/backup/<снимок>
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

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Bun может отсутствовать в PATH у cron — добавляем типовое место.
export PATH="${HOME}/.bun/bin:${PATH}"

SDK_DIR="${BACKUP_SDK_DIR:-${HOME}/server-ops}"
# shellcheck source=/dev/null
source "${SDK_DIR}/lib/backup-contract.sh"

SERVICE="u7-school"
TYPE="files"
BACKUP_DIR="data/backup"
FINGERPRINT_FILE="${BACKUP_DIR}/.fingerprint"
REASON="planned"
FORCE=0
PROTECTED=0

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

# ── Отпечаток данных: менялось ли что-то с прошлого снимка ─────────────────
compute_fingerprint() {
  local rel
  for rel in "${FILES[@]}"; do
    [ -f "data/${rel}" ] || continue
    printf '%s\t%s\t%s\n' \
      "$rel" \
      "$(stat -c '%s' "data/${rel}")" \
      "$(date -u -r "data/${rel}" '+%s')"
  done
}

write_fingerprint() {
  local fp="$1" tmp
  tmp="$(mktemp "${BACKUP_DIR}/.fingerprint.XXXXXX")"
  printf '%s\n' "$fp" > "$tmp"
  mv "$tmp" "$FINGERPRINT_FILE"
}

# ── Разбор аргументов ──────────────────────────────────────────────────────
while [ $# -gt 0 ]; do
  case "$1" in
    --help|-h)
      sed -n '3,24p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    --force)
      FORCE=1; shift ;;
    --name=*)
      REASON="${1#--name=}"; PROTECTED=1; FORCE=1; shift ;;
    --list)
      shopt -s nullglob
      for d in "${BACKUP_DIR}"/*/; do
        [ -f "${d}manifest.json" ] || continue
        printf '%s\n' "${d%/}"
      done
      shopt -u nullglob
      exit 0
      ;;
    --prune)
      bc_begin --service "$SERVICE" --type "$TYPE" --backup-dir "$BACKUP_DIR" \
               --source data/users/users.json --reason prune >/dev/null
      bc_prune 7 4 6
      exit 0
      ;;
    --verify)
      shift
      snap="${1:-}"
      [ -n "$snap" ] || { echo "укажи каталог: --verify data/backup/<снимок>" >&2; exit 1; }
      if bc_verify_snapshot "$snap"; then
        echo "✅ verify ok: ${snap}"
      else
        echo "❌ verify failed: ${snap}" >&2
        exit 1
      fi
      exit 0
      ;;
    -*)
      echo "неизвестная опция: $1" >&2; exit 1 ;;
    *)
      REASON="$1"; shift ;;
  esac
done

# Плановые снимки могут пропускаться; всё остальное (before-*, ручное) — всегда.
case "$REASON" in
  planned|scheduled) : ;;
  *) FORCE=1 ;;
esac

mkdir -p "$BACKUP_DIR"

new_fp="$(compute_fingerprint | sha256sum | awk '{print $1}')"
old_fp="$(cat "$FINGERPRINT_FILE" 2>/dev/null || echo '')"
changed=0
[ "$new_fp" != "$old_fp" ] && changed=1

bc_begin --service "$SERVICE" --type "$TYPE" --backup-dir "$BACKUP_DIR" \
         --source "$FINGERPRINT_FILE" --reason "$REASON" \
         --trigger "${BC_TRIGGER:-service}" \
         --max-age-hours 26 --min-interval-min 60

if [ "$FORCE" = 1 ] || [ "$changed" = 1 ]; then
  [ "$changed" = 1 ] && write_fingerprint "$new_fp"
  BC_STATE="create"
fi

if [ "$BC_STATE" = "skip" ]; then
  echo "⏭️  Пропуск: данные не менялись с прошлого снимка"
  exit 10
fi

# ── Снимок ─────────────────────────────────────────────────────────────────
SNAP="$(bc_new_snapshot)"

copied=0
for rel in "${FILES[@]}"; do
  if [ -f "data/${rel}" ]; then
    mkdir -p "${SNAP}/$(dirname "${rel}")"
    cp "data/${rel}" "${SNAP}/${rel}"
    copied=$((copied + 1))
  else
    echo "⚠️  Пропущен (нет файла): data/${rel}"
  fi
done

# ── Метаданные версии кода (для обратной совместимости) ─────────────────────
VERSION="$(bun -e 'const p = await Bun.file("package.json").json(); console.log(p.version ?? "unknown")' 2>/dev/null || echo "unknown")"
GIT_TAG="$(git describe --tags --abbrev=0 2>/dev/null || echo "нет")"
GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")"
GIT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")"

{
  echo "timestamp:  $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  echo "reason:     ${REASON}"
  echo "version:    ${VERSION}"
  echo "git_tag:    ${GIT_TAG} (ближайший тег на момент бэкапа)"
  echo "git_commit: ${GIT_COMMIT}"
  echo "git_branch: ${GIT_BRANCH}"
} > "${SNAP}/meta.txt"

export BC_PROTECTED="$PROTECTED"
bc_finalize "$SNAP" >/dev/null

if ! bc_verify_snapshot "$SNAP"; then
  echo "❌ verify не прошёл для ${SNAP}" >&2
  exit 1
fi

echo "✅ Бэкап создан: ${SNAP} (файлов: ${copied}/${#FILES[@]}, protected=${PROTECTED})"
