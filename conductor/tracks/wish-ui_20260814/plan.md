# План реализации — Трек D: wish UI (каталог курсов)

## Фаза 1: Кнопка apply в course-catalog

- [x] Task: Написать падающие тесты на кнопку «🎓 Хочу пройти курс» и обработку `apply` (instant/questionnaire/конфликт) — caa3026
- [x] Task: Добавить кнопку на карточку курса + обработчик `apply` в `course-catalog.story` — caa3026
- [x] Task: Conductor - Ручная верификация 'Кнопка apply'

## Фаза 2: Экраны W03/W04 + статус в ошибке конфликта [checkpoint: 4c24170]

- [x] Task: Расширить `WISH_ALREADY_EXISTS` полем `status` желания (packages/wish) + тесты — e5e8ea
- [x] Task: Написать падающие тесты на экраны W03 (мгновенно) и W04 (обе ветки: `pending` / `expressed`) — 094235f
- [x] Task: Реализовать рендеринг W03/W04 (+ кнопка «🗑️ Отменить желание» на W04 — вход в W05) — 094235f
- [x] Task: Conductor - Ручная верификация 'Экраны W03/W04' — 4c24170

## Фаза 3: Продолжение анкеты (fill:resume) + completionText [checkpoint: 02e81bf]

- [x] Task: Написать падающие тесты на `fill:resume:{courseId}` (анкета найдена/не найдена, captureInput)
- [x] Task: Реализовать ветку `resume` в FillStory + `Routes.questionnaire.resume(courseId)` — 29d0ae0
- [x] Task: Написать падающие тесты на проброс `completionText` в `CompletedResponse` и рендер в FillStory — ae430a9
- [x] Task: Пробросить `completionText` в `CompletedResponse` (packages/questionnaire) + рендер в FillStory — ae430a9
- [x] Task: Написать падающие тесты на прогресс «Вопрос N из M» и подсказку `/cancel` в первом вопросе — 11d5432
- [x] Task: Реализовать прогресс и подсказку в FillStory — 11d5432
- [x] Task: Conductor - Ручная верификация 'Продолжение анкеты + completionText' — 02e81bf

## Фаза 4: Отмена W05 + обновление ui-spec

- [x] Task: Написать падающие тесты на отмену (подтверждение + cancel-wish) — b4b6686
- [x] Task: Реализовать `cancel` + подтверждение + сообщение об отмене — b4b6686
- [x] Task: Обновить `course/ui-spec.md` (статусы → ✅) — 1201ece
- [ ] Task: Conductor - Ручная верификация 'Отмена W05 и ui-spec'
