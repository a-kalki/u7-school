# Git: `conductor/archive/` в `.gitignore` — `git add` отказывается

- **Симптомы:** При архивировании трека `git add conductor/archive/<track_id>/` падает с ошибкой «Следующие пути игнорируются одним из ваших файлов .gitignore: conductor/archive». При этом уже существующие архивы в `git ls-files conductor/archive/` — отслеживаются.

- **Причина:** `conductor/archive/` прописан в `.gitignore`, но исторические файлы архивов были добавлены через `git add -f` и остались отслеживаемыми (gitignore не действует на уже отслеживаемые файлы). Обычный `git add` для новых путей в игнорируемой директории отказывается.

- **Решение:** Для переноса трека в архив используй `git mv` — он stagedит переименование даже в игнорируемую директорию. После `git mv` добавляй только реестр (`tracks.md`) и коммить; переименования уже в индексе.

  ```bash
  mkdir -p conductor/archive
  git mv conductor/tracks/<track_id> conductor/archive/<track_id>
  git add conductor/tracks.md   # archive/ через git add не нужен — уже в индексе
  git commit -m "chore(conductor): Архивировать трек '...'"
  ```

  Если нужно принудительно добавить новый файл в игнорируемую папку — `git add -f <path>`.
