# 3. Пайплайн «Событие → Анкета → Метрики» + новые модули

**Назначение:** технический документ. Связующая ткань: как события в системе превращаются в анкеты, а анкеты — в метрики. Плюс два новых модуля: `peer-review` и `metrics`.

> **Родительский документ:** [Система сбора метрик](./metrics-system.md)
> **Связан с:** [1. Концепция метрик](./metrics-conception.md) — формулы агрегации
> **Связан с:** [2. Questionnaire + EventBus](./metrics-questionnaire-and-events.md) — движок анкет, EventBus, запуск анкет
>
> **Актуализация (2026-09-09):** документ сведён с [tasks-system](./tasks-system.md)
> (инициатива V проектировалась позже и поглотила механику приглашений): все
> асинхронные предложения («оцени напарника», «заполни анкету») реализуются
> **задачами** модуля `task`, а не собственными статусами анкет и не кнопочными
> проактивами. Прежний intention-паттерн (статус `intention` у агрегата анкеты)
> не вводится — см. трек 3.1.

---

## Общий поток данных

```
stream (ModuleEnrollment.complete)
  │  addEvent(ModuleCompleted)
  │  → UC publishEvents
  ▼
EventBus ──> peer-review (подписчик)
                │  taskFacade.upsert({ kind: 'questionnaire.invite', окно жизни,
                │                     ownerInfo: { context, role, subjectId,
                │                                 respondentId, triggerEvent } }) × N
                │  → task-модуль: userFacade.notify «есть дело — /tasks»
                ▼
           пользователь: /tasks → кнопка задачи [Начать анкету]
                │  → мост в контроллер questionnaire (BotUiApp)
                │  → start (пул по context + role) → handleAction → ... → completed
                │  addEvent(QuestionnaireComplete)
                │  → UC publishEvents
                ▼
           EventBus ──> metrics (подписчик)
                         │  извлекает likertScores
                         │  обновляет StudentMetrics
                         ▼
                      профиль студента
```

Прямой старт (без приглашения) — когда пользователь инициировал анкету сам
действием в боте (например, анкета желания в `wish`): инициатор выполняет
`questionnaireFacade.start(...)` синхронно и делегирует экран в `fill`-стори
(`delegate`) — задача не создаётся, кнопка «Начать» не нужна.

---

## Треки

### Трек 3.1 — Приглашения анкет через задачи (tasks-system)

**Цель:** предложить анкету пользователю, не вторгаясь в его текущий флоу, с окном актуальности и памятью об отказе.

**Проблема:** исторически проектировался intention-паттерн — отдельный статус `intention` у агрегата анкеты («анкета предложена, ждёт согласия») плюс проактивные кнопки «Оценить напарника». После проработки [tasks-system](./tasks-system.md) эта механика избыточна: задача уже даёт окно жизни, память отказа (`task.skipped` → ER владельца), уведомление «есть дело — /tasks» и кнопку в едином списке. Двойная механика «ожидающего действия» (статус анкеты ⊕ статус задачи) не вводится.

**Решение — приглашение = задача:**

- Модуль-владелец (peer-review) создаёт задачу: `taskFacade.upsert({ kind:
  'questionnaire.invite', assigneeId: respondentId, dedupeKey, mandatory: false,
  expiresAt: <окно актуальности>, ownerInfo: { context, role, subjectId,
  respondentId, triggerEvent } })`. Пул вопросов в задаче НЕ персистится —
  тексты вычисляются на лету (`TaskTypeMeta.resolveRenderInfo`).
- Task-модуль уведомляет: `userFacade.notify` «📋 Есть дело — /tasks» (текст
  без кнопок, инвариант И3 [bot-ui](./bot-ui-session-architecture.md)).
- В `/tasks` задача рендерится контрактом `TaskRenderInfo` (кнопка [Начать
  анкету]); kind-рендерер questionnaire превращает её в колбек своей стори —
  дальше штатная маршрутизация бота (мост со штампом).
- Нажатие → UC `start` с пулом по `context` + `role` → диалог `fill` →
  обычный жизненный цикл анкеты → `questionnaire.completed`.
- Отказ ([Пропустить] / истечение окна) → `task.skipped`/`task.expired` → ER
  владельца → `QuestionnaireAr.decline()` (память: не предлагать до нового
  повода).

**Механика без изменений:** жизненный цикл самой анкеты (`invited →
in_progress → completed/abandoned` из трека 2.4a+) остаётся; задача — только
способ доставки предложения, агрегат анкеты создаётся в момент старта.

---

### Трек 3.2 — События в `stream`

**Цель:** `stream` при завершении модуля студентом генерирует доменное событие.

**Где:** агрегат `ModuleEnrollmentAr` (или его аналог в `packages/stream`).

**Изменения:**
- `ArMeta.events` дополняется типом `ModuleCompletedEvent`
- Метод `complete()` (или аналогичный) после перехода в `advanced`/`not_advanced` кладёт событие:

```typescript
this.addEvent({
  eventId: crypto.randomUUID(),
  eventName: 'module.completed',
  occurredAt: isoNow(),
  aggregateName: 'ModuleEnrollment',
  aggregateId: this.state.uuid,
  payload: {
    studentId: this.state.studentId,   // telegramId студента
    courseId: this.state.courseId,
    moduleId: this.state.moduleId,
    outcome: this.state.outcome,       // "advanced" | "not_advanced" | "abandoned"
    completedAt: isoNow(),
  },
});
```

- UC после `repo.save()` → `publishEvents(ar)`.

**Важно:** событие генерируется только при финальном переходе (advanced/not_advanced/abandoned), не при промежуточных шагах.

**Местоположение:** `packages/stream/src/domain/...` — найти текущий агрегат зачисления и расширить.

---

### Трек 3.3 — Модуль `peer-review`

**Цель:** новый пакет, отвечающий за кросс-оценки, парное программирование, код-ревью.

**Ответственности:**
- Подписка на `module.completed` → создание задач-приглашений для группы
- Управление сессиями парного программирования («кто смотрит», «кто программирует»)
- Запуск анкет по завершении парного урока

**Структура пакета:**

```
packages/peer-review/src/
  domain/
    module.ts                  — PeerReviewApiModuleMeta, PeerReviewApiModuleResolver
    review-session/
      entity.ts                — ReviewSession (type: pair_programming | code_review | cross_review)
      a-root.ts                — PeerReviewAr
      repo.ts                  — PeerReviewRepo (интерфейс)
      policy.ts
    index.ts
  api/
    module.ts                  — PeerReviewApiModule
    review-session/
      create-session-uc.ts
      complete-session-uc.ts
      orchestrate-module-reviews-uc.ts  — оркестратор при module.completed (создаёт задачи)
  infra/
    db/
      review-session-json-repo.ts
    peer-review-bootstrap.ts   — подписки на EventBus
  index.ts
```

UI бота — в `apps/u7-bot/src/controllers/` (контракт «Диалог и Экран»):
kind-рендерер `questionnaire.invite` у questionnaire-контроллера, при
потребности — контроллер сессий парного программирования.

**Оркестрация при `module.completed`:**

```typescript
// OrchestrateModuleReviewsUc — вызывается из подписчика EventBus
async execute(event: ModuleCompletedEvent): Promise<void> {
  const { courseId, studentId, moduleId } = event.payload;

  // 1. Найти группу (всех студентов того же потока)
  const group = await this.resolve.streamFacade.getGroupByCourseId(courseId);

  // 2. Для каждой ПАРЫ студентов (A←B, B←A) — задача-приглашение student_student
  for (const reviewer of group) {
    if (reviewer.telegramId === studentId) continue; // не себе

    await this.resolve.taskFacade.upsert({
      kind: 'questionnaire.invite',
      assigneeId: reviewer.userId,
      dedupeKey: `module-completed:${moduleId}:${studentId}:${reviewer.userId}`,
      mandatory: false,
      expiresAt: isoInDays(14), // окно актуальности предложения
      ownerInfo: {
        context: 'module_completed',
        role: 'student_student',
        subjectId: studentId,
        respondentId: reviewer.userId,
        triggerEvent: { type: 'module_completed', aggregateId: event.aggregateId },
      },
    });
  }

  // 3. Для ментора потока — задача mentor_student (аналогично)
  // ...
}
```

Уведомления, напоминания, дайджест-склейка и окна жизни — централизованы в
`task`-модуле; peer-review только создаёт задачи ([tasks-system-architecture.md](./tasks-system-architecture.md)).

**Парное программирование:**
- `PeerReviewAr` управляет сессией: `start(reviewerId, programmerId, lessonId)` → `complete(outcome)`
- При `complete()` → задача-приглашение `questionnaire.invite` с `context: 'pair_programming'` для «смотревшего» оценить «программировавшего»
- Пул вопросов для `pair_programming` фокусируется на самостоятельности (ключевой вопрос: «писал ли код сам, без ИИ»)

**Контроллер бота:**
- Отдельного «списка предложений» нет — кнопки [Оценить напарника] живут в `/tasks` (kind-рендерер questionnaire, слой C tasks-system)
- Нужен только UI сессий парного программирования, если появится их ручное управление

---

### Трек 3.4 — Модуль `metrics`

**Цель:** новый пакет, хранящий и агрегирующий метрики студента.

**Ответственности:**
- Подписка на `questionnaire:complete` → извлечение `likertScores` → обновление `StudentMetrics`
- Потребление авто-метрик от `stream` (посещаемость, скорость)
- API для запроса профиля студента

**Структура пакета:**

```
packages/metrics/src/
  domain/
    module.ts                  — MetricsApiModuleMeta, MetricsApiModuleResolver
    student-metrics/
      entity.ts                — StudentMetrics (студент, scores по категориям, история)
      a-root.ts                — StudentMetricsAr
      repo.ts                  — StudentMetricsRepo (интерфейс)
      policy.ts
      types.ts                 — SkillScore, CategoryScore, StudentProfile
    index.ts
  api/
    module.ts                  — MetricsApiModule
    student-metrics/
      update-metrics-uc.ts     — подписчик на QuestionnaireComplete
      get-profile-uc.ts        — запрос профиля студента
      ingest-auto-metrics-uc.ts — приём авто-метрик от stream
  infra/
    db/
      student-metrics-json-repo.ts
    metrics-bootstrap.ts       — подписки на EventBus
  ui/
    bot/controller/            — MetricsController (показ профиля)
  index.ts
```

**Модель `StudentMetrics`:**

```typescript
interface SkillScore {
  category: string;
  subcategory: string;
  score: number;           // средневзвешенный балл по анкетам
  sampleSize: number;      // количество анкет
  lastUpdated: string;
}

interface StudentMetrics {
  uuid: string;
  studentTelegramId: number;
  professionalSkills: SkillScore[];  // разбивка по подкатегориям профессионализма
  teamSkills: SkillScore[];          // разбивка по подкатегориям командных
  personalSkills: SkillScore[];      // разбивка по подкатегориям личностных
  mentorRecommendation?: string;      // текст рекомендации ментора
  peerRecommendations: string[];      // рекомендации студентов
  updatedAt: string;
}
```

**Агрегация при `questionnaire:complete`:**

```typescript
// UpdateMetricsUc
async execute(event: QuestionnaireCompleteEvent): Promise<void> {
  const { subjectId } = event.ownerInfo;
  const { likertScores } = event.payload;
  if (!likertScores) return;  // не метрическая анкета (например анкета желания в `wish`)

  let metrics = await this.resolve.studentMetricsRepo.getByTelegramId(subjectId);
  if (!metrics) {
    metrics = StudentMetricsAr.create(subjectId);
  }

  const ar = new StudentMetricsAr(metrics);
  ar.ingestScores(likertScores, event.ownerInfo.context);
  // ar пересчитывает средние, обновляет sampleSize

  await this.resolve.studentMetricsRepo.save(ar.state);
}
```

**Интеграция со `stream`:**
- `stream` может напрямую дёргать `MetricsFacade.ingestAutoMetrics(telegramId, autoMetrics)`
- Или публиковать `AutoMetricsUpdated` событие (более единообразно с шиной)

**Витрина профиля** (см. Документ 1, §5):
- `GetProfileUc` собирает все метрики + рекомендации
- `MetricsController` рендерит в MarkdownV2 (или текст) для бота
- ⚠️ Лимит Telegram — 4096 символов на сообщение: профиль с рекомендациями
  может не влезть. Контракт bot-ui не содержит серии экранов — витрину
  строить пагинацией на уровне стори (кнопки-мосты «Ещё ›» в ту же стори),
  заложить сразу в дизайн `MetricsController`

---

## Зависимости между модулями (финальная схема)

```
┌──────────┐
│  core    │  EventBus (интерфейс), InProcEventBus, Aggregate API
└────┬─────┘
     │ зависит
     ▼
┌──────────────┐     ┌─────────────────┐
│ wish         │────>│  questionnaire  │
│ (желания     │     │  (движок анкет) │
│  пройти курс,│     │                 │
│  target-     │     │ • BaseAr        │
│  модель)     │     │ • LikertAr      │
│              │     │ • LikertAr      │
└──────────────┘     │ • QuestionPool  │
                     └────────┬────────┘
                              │ зависит
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌────────────────┐  ┌────────────────┐  ┌──────────────────┐
│  peer-review   │  │    metrics     │  │     stream       │
│                │  │                │  │                  │
│ • подписка на  │  │ • подписка на  │  │ • генерирует     │
│   ModuleComp-  │  │   Questionn-   │  │   ModuleComp-    │
│   leted        │  │   aireComp-    │  │   leted          │
│ • создаёт      │  │   leted        │  │ • авто-метрики   │
│   задачи-      │  │ • StudentMet-  │  │                  │
│   приглашения  │  │   ricsAr       │  │                  │
│ • парное прог. │  │                │  │                  │
└────────────────┘  └────────────────┘  └──────────────────┘

        ┌──────────┐
        │   task   │  ← peer-review (фасад задач-приглашений)
        │ (задачи, │
        │  notify) │  → questionnaire (старт по кнопке задачи)
        └──────────┘
```

**Ключевые правила зависимостей:**
- `questionnaire` НЕ зависит от `metrics`, `peer-review`, `stream`, `task` — движок анкет не знает, кто и зачем его запускает
- `peer-review` зависит от `questionnaire` (фасад старта), `task` (фасад задач-приглашений), `stream` (фасад для группы), `user` (фасад)
- `metrics` зависит от `questionnaire` (читает likertScores из событий)
- `stream` НЕ зависит от `peer-review` или `metrics` (только публикует события)
- `task` ни о ком не знает (кроме `user` — notify, как все)

---

## Связанные документы

- [Система сбора метрик (родитель)](./metrics-system.md)
- [1. Концепция метрик](./metrics-conception.md) — формулы агрегации, витрина
- [2. Questionnaire + EventBus](./metrics-questionnaire-and-events.md) — движок анкет, EventBus, запуск анкет
- [DDD API](../.pi/skills/ddd-api/SKILL.md) — UseCase, Module, BotUiStory
- [DDD Naming](../.pi/skills/ddd-naming/SKILL.md) — именование пакетов, файлов
- [Границы доменной логики](./code_styleguides/domain-boundaries.md) — межмодульные взаимодействия
- [Архитектурная эволюция](./archive/mentor_tools_20260713/architecture-evolution.md) — контекст Релизов 1–3 (в архиве)
