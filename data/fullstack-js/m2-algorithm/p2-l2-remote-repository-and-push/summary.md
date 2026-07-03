# Удалённый репозиторий и git push — краткая выжимка

⏱ **Видео:** ~12 мин

- **Remote** — копия репозитория на сервере (GitHub). Нужна для бэкапа, совместной работы, PR
- **Создание репо:** GitHub → + → New repo → имя `js-algorithms` → Public/Private → НЕ добавлять README
- `git remote add origin git@github.com:username/js-algorithms.git` — привязать локальный репо к GitHub
- `git remote -v` — посмотреть список remote
- `git push -u origin main` — первый push: отправить ветку main на GitHub и запомнить связку (`-u`)
- `git branch -r` / `git branch -a` — посмотреть удалённые / все ветки
- После push: страница репозитория на GitHub показывает файлы и историю коммитов

[Полный конспект](./lesson.md)
