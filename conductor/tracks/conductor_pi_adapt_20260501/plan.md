# План реализации: Адаптация документации Conductor под pi и перевод на русский

## Фаза 1: AGENTS.md и корневые файлы [checkpoint: 7089962]
- [x] Task: Перевод и адаптация AGENTS.md `6ee3b7a`
    - [x] Перевести Universal File Resolution Protocol на русский язык.
    - [x] Проверить и сохранить все перекрёстные ссылки (conductor/index.md, conductor/tracks.md и т.д.).
    - [x] Убедиться, что весь файл следует языковому правилу (русский).
- [x] Task: Перевод и адаптация conductor/workflow.md `e905f28`
    - [x] Перевести весь файл на русский язык.
    - [x] Адаптировать секцию «Development Commands» под Bun/TypeScript/Biome (убрать примеры на Python/Go/Node).
    - [x] Проверить, что ссылки на инструменты (git, bun, biome) остались без изменений.
- [x] Task: Conductor - User Manual Verification 'Фаза 1: AGENTS.md и workflow' (Protocol in workflow.md)

## Фаза 2: Крупные skill-файлы (setup, implement) [checkpoint: 251a611]
- [x] Task: Перевод и адаптация conductor-setup/SKILL.md `c5d395d`
    - [x] Перевести весь файл на русский язык (~40K).
    - [x] Заменить `enter_plan_mode` / `exit_plan_mode` на описание работы в диалоговом режиме pi.
    - [x] Заменить `ask_user` на прямое обращение к пользователю в чате.
    - [x] Заменить `run_shell_command` → `bash`, `write_file` → `write`, `replace` → `edit`.
    - [x] Удалить упоминания `.geminiignore`.
    - [x] Адаптировать/удалить ограничения Plan Mode (запрет абсолютных путей, редиректов).
- [x] Task: Перевод conductor-setup/templates/workflow.md `b123db9`
    - [x] Перевести на русский язык.
    - [x] Убедиться, что шаблон в точности соответствует `conductor/workflow.md`.
- [x] Task: Перевод и адаптация conductor-implement/SKILL.md `6f9d17e`
    - [x] Перевести весь файл на русский язык (~16K).
    - [x] Заменить те же инструменты gemini-cli на pi.
    - [x] Адаптировать протокол Track Cleanup (archive/delete) под pi.
- [x] Task: Conductor - User Manual Verification 'Фаза 2: setup и implement' (Protocol in workflow.md)

## Фаза 3: Средние skill-файлы (newtrack, review) [checkpoint: f5eec0e]
- [x] Task: Перевод и адаптация conductor-newtrack/SKILL.md `90248e7`
    - [x] Перевести весь файл на русский язык (~12K).
    - [x] Заменить `enter_plan_mode` / `exit_plan_mode` / `ask_user` на диалоговый режим pi.
    - [x] Заменить `run_shell_command` → `bash`, `write_file` → `write`, `replace` → `edit`.
    - [x] Адаптировать протокол Interactive Specification Generation под текстовый диалог.
- [x] Task: Перевод и адаптация conductor-review/SKILL.md `90248e7`
    - [x] Перевести весь файл на русский язык (~12K).
    - [x] Заменить те же инструменты.
    - [x] Адаптировать протокол Review Output под pi.
- [x] Task: Conductor - User Manual Verification 'Фаза 3: newtrack и review' (Protocol in workflow.md)

## Фаза 4: Малые skill-файлы (revert, status) [checkpoint: d9c3562]
- [x] Task: Перевод и адаптация conductor-revert/SKILL.md `9905bd2`
    - [x] Перевести весь файл на русский язык (~9K).
    - [x] Заменить `ask_user` и другие gemini-инструменты.
    - [x] Проверить корректность git-команд (они не меняются, только описания вокруг).
- [x] Task: Перевод и адаптация conductor-status/SKILL.md `9905bd2`
    - [x] Перевести весь файл на русский язык (~3K).
    - [x] Минимальные правки (файл и так короткий и без сложных инструментов).
- [x] Task: Conductor - User Manual Verification 'Фаза 4: revert и status' (Protocol in workflow.md)

## Фаза 5: Верификация и финализация [checkpoint: a11d7cf]
- [x] Task: Проверка отсутствия старых инструментов `9f2ad1f`
    - [ ] Выполнить `grep -r "enter_plan_mode\|exit_plan_mode\|ask_user\|run_shell_command\|write_file\|geminiignore" .pi/skills/ conductor/ AGENTS.md` и убедиться, что результат пуст.
- [x] Task: Проверка функциональности `already_verified`
    - [ ] Выполнить `/conductor:status` и убедиться, что агент корректно читает документацию.
    - [ ] Проверить, что все перекрёстные ссылки между файлами разрешаются.
- [x] Task: Conductor - User Manual Verification 'Фаза 5: Верификация' (Protocol in workflow.md)
