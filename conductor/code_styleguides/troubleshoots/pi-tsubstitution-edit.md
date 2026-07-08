# Pi: `$T`-подстановка ломает `edit` на skill-файлах

- **Симптомы:** Команда `edit` к файлу `.pi/skills/*/SKILL.md` падает с «Could not find edits[0]... oldText must match exactly», хотя текст визуально совпадает с выводом `read`. При этом `grep`/`read` показывают в файле `$T1`, `$T2`… вместо реальных путей, а в начале вывода есть строка вида `[$T1=conductor/code_styleguides/skills/]`.

- **Причина:** Pi применяет контекст-компрессию: в выводах инструментов длинные повторяющиеся строки заменяются на токены `$T1`, `$T2`… с указанием карты подстановки. Эта же подстановка применяется и к **вводу** параметров инструментов — если в `oldText`/`newText` напечатать `$T1`, он заменится на сопоставленное значение, которое может не совпадать с реальным содержимым файла. Skill-файлы (`.pi/skills/*/SKILL.md`) и styleguide-карты часто содержат такие длинные строки путей.

- **Решение:** Редактируй такие файлы через `bash` (Python/sed), а не через `edit` — ввод в bash не проходит `$T`-подстановку. Если нужен токен `$T` в строке, собирай его из переменной, не печатай литералом.

  ```python
  # Python: правка skill-файла без $T-подстановки
  p = '.pi/skills/ddd-api/SKILL.md'
  prefix = 'conductor/code_styleguides/skills/'  # НЕ печатай $T1 — подставится
  with open(p, encoding='utf-8') as f:
      lines = f.readlines()
  lines[i] = '| BotController | ... | `' + prefix + 'bot-controller.md` |\n'
  with open(p, 'w', encoding='utf-8') as f:
      f.writelines(lines)
  ```

  Для проверки реального содержимого файла (без подстановки) читай его через Python `repr()` в bash:

  ```bash
  python3 -c "print([repr(l.rstrip()) for l in open('.pi/skills/ddd-api/SKILL.md')][:5])"
  ```
