# План реализации — Трек A: EventReaction в core

## Фаза 1: EventReaction + ErMeta

- [x] Task: Написать падающие тесты на `ErMeta`/`EventReaction` (init/getErName/getEventName/handle/getDocType) `038e033`
- [x] Task: Реализовать `ErMeta`, `ErDocType`, `EventReaction` в `packages/core/src/api/er/event-reaction.ts` `038e033`
- [x] Task: Экспортировать ER из `packages/core/src/api/index.ts` `038e033`
- [ ] Task: Conductor - Ручная верификация 'EventReaction'

## Фаза 2: Интеграция в ApiModule

- [x] Task: Написать падающие тесты на авто-подписку `reactions` в `ApiModule.init()` `e9c3ebd`
- [x] Task: Реализовать поле `reactions` и авто-подписку в `ApiModule.init()` `e9c3ebd`
- [ ] Task: Conductor - Ручная верификация 'Интеграция в ApiModule'

## Фаза 3: Документация ER

- [ ] Task: Создать styleguide ER в `conductor/code_styleguides/skills/`
- [ ] Task: Зарегистрировать ER в `arch-boundary-design/SKILL.md` (таблица решений) и `conductor/index.md`
- [ ] Task: Conductor - Ручная верификация 'Документация ER'
