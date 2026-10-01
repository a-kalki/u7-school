# Слияние веток и конфликты — краткая выжимка

- Теория: W3Schools [Branch Merge](https://www.w3schools.com/git/git_branch_merge.asp) + [Merge Conflicts](https://www.w3schools.com/git/git_merge_conflicts.asp)
- Fast-forward: когда main не двигался с момента ветвления; иначе — merge commit
- Конфликт: одна и та же строка изменена в двух ветках; маркеры `<<<<<<<` / `=======` / `>>>>>>>`; разрешить → `git add` → `git commit`
- `git merge --abort` — отменить начатое слияние
- `git reset --hard <хэш>` — откат локальной ветки (история переписывается, восстановимо через `git reflog`); безопасно только для непушеных коммитов
- Опубликованная ветка → `git revert` (коммит-отмена, история целостна)
- Эксперименты — только в отдельных ветках: рабочая `feat/substring-search` остаётся чистой

[Полный конспект](./lesson.md)
