# Track wish-module_20260828

- [Спецификация](./spec.md)
- [План реализации](./plan.md)
- [Метаданные](./metadata.json)

## Контекст

- [arch-boundary-design](../../.pi/skills/arch-boundary-design/SKILL.md) — где размещать логику
- [Трек wish-fulfillment](../wish-fulfillment_20260814/spec.md) — событие `student.enrolled`, ER fulfill-wish
- [FillStory](../../apps/u7-bot/src/controllers/questionnaire/fill.story.ts) — прецедент подписок стори на события
- [BotTransport](../../apps/u7-bot/src/infra/bot-transport.ts) — механика `keepPrevKeyboard`/`captureInput`
- [Фасад курса](../../packages/course/src/domain/facade.ts) — расширяется доменными методами
- [Рабочий процесс](../../workflow.md) — жизненный цикл задач
