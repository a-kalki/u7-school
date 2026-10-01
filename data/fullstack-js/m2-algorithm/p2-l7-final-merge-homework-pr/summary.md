# Финальный мерж homework-PR — краткая выжимка

- Условия мержа: 2 апрува + все conversation resolved + нет незакрытых комментариев
- Мерж: Merge pull request → Merge commit (по умолчанию) → Confirm merge → Delete branch
- После мержа: `git switch main` → `git pull origin main` → `git log --oneline` (коммиты из ветки в main)
- Чистка: `git branch -d docs/homework` → `git fetch --prune` → `git branch -a`
- Полный пройденный цикл: ветка → файл → push → PR → чат → ревью → апрувы → мерж
- Ветки после мержа восстанавливаемы (пока коммиты живы)

[Полный конспект](./lesson.md)
