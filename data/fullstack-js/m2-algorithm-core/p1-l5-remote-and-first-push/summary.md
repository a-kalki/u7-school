# Удалённый репозиторий и первый push — краткая выжимка

- `git remote add origin git@github.com:<user>/<repo>.git` — связь с GitHub; проверка: `git remote -v`
- Новый репозиторий на GitHub: **без** README/.gitignore/license — они уже есть локально
- Контрольная точка перед push: `git branch --show-current` → должно быть `main`
- `git push -u origin main` — первый push; `-u` запоминает связь ветки с remote (дальше — просто `git push`)
- push = отправка коммитов на GitHub, pull = забирание с GitHub
- Коммиты без push живут только локально: поломка компьютера = потеря
- Сверка: вкладка commits на GitHub ↔ `git log --oneline` локально

[Полный конспект](./lesson.md)
