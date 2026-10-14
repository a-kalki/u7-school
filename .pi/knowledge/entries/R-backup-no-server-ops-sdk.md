# backup.sh: `bun run backup` падает вне сервера (нет ~/server-ops)

- **Симптомы:** `scripts/backup.sh: строка 45: /home/nur/server-ops/lib/backup-contract.sh: Нет такого файла или каталога`;
  `error: script "backup" exited with code 1`.
- **Причина:** `scripts/backup.sh` подключает внешний SDK бэкапов из `~/server-ops`
  (`BACKUP_SDK_DIR`, по умолчанию `$HOME/server-ops`). Каталог есть на сервере, но не в dev-окружении.
- **Решение:** В dev `bun run backup` недоступен. Для git-защищённого контента (`data/courses/*.json`)
  откат обеспечивает git; перед массовой записью сделай копию штатным инструментом
  (не в `/tmp`, а в постоянное место `data/backup-adhoc/`):

  ```bash
  bun run backup:adhoc --courses before-content-edit
  # или произвольные пути:
  bun run backup:adhoc before-x data/courses/steps.json
  ```

  Если нужен именно контрактный бэкап — задай `BACKUP_SDK_DIR` на каталог с `lib/backup-contract.sh`
  (на сервере это `~/server-ops`).
