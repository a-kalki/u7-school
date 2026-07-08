# План реализации: Роль AUTHOR

> Контекст: `../../architecture-evolution.md` §2.9, `./spec.md`. TDD (Red→Green), см. `conductor/workflow.md`.

## Фаза 1: Роль AUTHOR в домене user

- [x] Task: Написать тесты Role/RoleSchema (AUTHOR валиден, входит в список) [8e41ee2]
- [x] Task: Добавить `Role.AUTHOR` + `RoleSchema` [8e41ee2]
  - [x] `packages/user/src/domain/user/roles.ts` [8e41ee2]
- [x] Task: Обновить `UserPolicy` метод isAuthor() [8e41ee2]
- [ ] Task: Conductor - Ручная верификация 'Роль AUTHOR'

## Фаза 2: Gates создания контента

- [x] Task: Написать тесты ModulePolicy.canCreate [bf1ce71]
  - [x] AUTHOR → true; MENTOR (без AUTHOR) → false; ADMIN → false [bf1ce71]
- [x] Task: Изменить `ModulePolicy.canCreate`: MENTOR → AUTHOR [bf1ce71]
- [x] Task: Написать тесты create-module UC: AUTHOR создаёт; ADMIN/MENTOR без AUTHOR → access denied [bf1ce71]
- [x] Task: Обновить create-module UC (gating уже через canCreate — проверить) [bf1ce71]
- [x] Task: Проверить add-project/create-lesson/create-step — остаются isAuthor-based (без изменений), добавить тест что AUTHOR-автор модуля может, а MENTOR-не-автор не может [bf1ce71]
- [~] Task: Conductor - Ручная верификация 'Gates создания'

## Фаза 3: Тесты редактирования (regression)

- [x] Task: Написать тесты canEdit (ADMIN редактирует; author редактирует; чужой MENTOR не может) [45a859d]
- [x] Task: Подтвердить что enrich-module/publish-module/add-project gating не сломан [45a859d]
- [~] Task: Conductor - Ручная верификация 'Редактирование и regression'

## Фаза 4: Миграция и документация

- [ ] Task: Миграция прод-ролей: выдать AUTHOR авторам существующих модулей (Нур) — на месте
- [ ] Task: Обновить `conductor/product.md` (роль AUTHOR, уточнить MENTOR)
- [ ] Task: Обновить `conductor/architecture-evolution.md` (§2.9, отметить реализацию)
- [ ] Task: Обновить `packages/stream/src/ui/bot/ui-spec.md` при необходимости
- [ ] Task: Проверить, обновить сломанные и добавить интеграционные/e2e тесты в `tests/bot/*` (gates создания: AUTHOR создаёт модуль; ADMIN/MENTOR без AUTHOR → access denied; canEdit — ADMIN редактирует)
- [ ] Task: Conductor - Ручная верификация 'Миграция и документация AUTHOR'
