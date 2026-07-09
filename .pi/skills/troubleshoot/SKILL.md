---
name: troubleshoot
description: ЗАГРУЗИ при любой неожиданной ошибке (компиляция, runtime, тесты, линтер, git) или странном поведении библиотеки/инструмента — проверь, есть ли известное решение в базе. Также используй после решения нетривиальной проблемы, чтобы записать его для будущего.
---

# Troubleshoot — База известных проблем

## Директива

При столкновении с **неожиданной ошибкой** или **странным поведением** библиотеки/инструмента — ДО того как начинать чинить, прочитай реестр ниже. Возможно решение уже есть. Это обязательно для: ошибок компиляции/runtime/тестов/линтера, странностей git, неожиданного поведения valibot/bun/biome/typescript и инструментов pi.

## Как использовать

1. Найди запись в реестре ниже по тегу или описанию симптома.
2. Перейди по ссылке → прочитай файл → примени решение.
3. Если решения нет — реши проблему, затем **добавь запись** (см. ниже).

## Как добавить новую запись

После решения нетривиальной проблемы (если потрачено много шагов и решение пригодится в будущем):

1. Создай файл `conductor/code_styleguides/troubleshoots/<tag>-<short-slug>.md`.
2. Заполни: **Симптомы**, **Причина**, **Решение** (с примером кода/команды).
3. Добавь строку в реестр ниже.
4. В финальном отчёте задания сообщи пользователю о добавленной записи.

Структура файла:

```markdown
# <Библиотека/Инструмент>: <Краткое описание>

- **Симптомы:** что наблюдается, текст ошибки.
- **Причина:** почему так происходит.
- **Решение:** ... (с примерами кода/команд)
```

## Реестр

| Теги | Описание | Файл |
|---|---|---|
| `#valibot` `#test` `#date` | `isoDateTime` принимает только `YYYY-MM-DDTHH:mm`, отклоняет миллисекунды и `Z` | [valibot-isoDateTime-format.md](../../../conductor/code_styleguides/troubleshoots/valibot-isoDateTime-format.md) |
| `#pi` `#edit` | `$T`-подстановка ломает `edit` на skill-файлах — oldText не совпадает | [pi-tsubstitution-edit.md](../../../conductor/code_styleguides/troubleshoots/pi-tsubstitution-edit.md) |
| `#git` `#gitignore` | `conductor/archive/` в `.gitignore` — `git add` отказывается добавлять | [git-archive-gitignore.md](../../../conductor/code_styleguides/troubleshoots/git-archive-gitignore.md) |
| `#deploy` `#valibot` `#isoDateTime` | Миграция пишет `updatedAt` с пробелом вместо `T` — невалидный isoDateTime | [deploy-migration-updatedAt-format.md](../../../conductor/code_styleguides/troubleshoots/deploy-migration-updatedAt-format.md) |
