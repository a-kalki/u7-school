# Бэкапы u7-school

Кратко: живые данные — JSON-файлы в `data/` (не защищены git). Снимки лежат в
`data/backup/`, тоже вне git. Общая система — в
`~/server-ops/docs/plans/backup-system.md`.

> Это дочерний документ: в `AGENTS.md` — только навигатор, детали здесь.

## Что и как бэкапится

- **Тип:** `files`.
- **Метод:** пофайловое копирование JSON-хранилищ в самодостаточный снимок.
- **Раскладка снимка (контракт v1):**

```
data/backup/
  2026-10-01T020000Z-planned/
    manifest.json      # тип, причина, git-версия, sha256 файлов, verify
    meta.txt           # совместимость со старыми deploy/rollback-инструкциями
    users/users.json
    streams/streams.json
    ...
  2026-10-01T183000Z-before-deploy/
    ...
```

Каждый снимок **самодостаточен и самоописан**. Старые снимки без
`manifest.json` (в т.ч. ручные `enroll-*`, `stream-snapshot-*`) ретенция не
трогает.

## Команды

```bash
bun run backup                    # = bash scripts/backup.sh planned (может пропустить)
bash scripts/backup.sh before-deploy     # перед деплоем (всегда снимок)
bash scripts/backup.sh before-rollback   # перед откатом
bash scripts/backup.sh before-migration  # перед миграцией
bash scripts/backup.sh --name=before-x   # именованный protected-снимок
bash scripts/backup.sh --list
bash scripts/backup.sh --prune
bash scripts/backup.sh --verify data/backup/<снимок>
```

### Коды возврата (контракт)

| Код | Значение |
|---|---|
| `0` | снимок создан |
| `10` | пропущено (данные не менялись) |
| `1` | ошибка |

Оркестратор (`~/server-ops/services/backup-orchestrator`) вызывает
`bash scripts/backup.sh scheduled` каждые 4 часа; раз в сутки `data/backup/`
вывозится за пределы сервера через restic (служба `offsite-backup`).

## Восстановление

1. Остановить бота: `pm2 stop u7-school-bot`.
2. Восстановить данные нужного снимка (сначала сохранив текущие!):
   ```bash
   rsync -a --exclude manifest.json --exclude meta.txt \
     data/backup/<снимок>/ data/
   ```
   Выбирай снимок с версией кода, совпадающей с развёрнутой (см. `meta.txt`).
3. Запустить: `pm2 start u7-school-bot`.
4. Проверить диалог бота тестовым сообщением.

## Правила

- Перед массовой правкой данных — `bun run backup` (или `--name=`).
- Не удалять/не перезаписывать файлы в `data/` и `data/backup/` без явного
  подтверждения.
