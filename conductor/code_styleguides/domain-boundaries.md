# Границы доменной логики

> **Приоритет: ВЫСОКИЙ.** Этот документ определяет, где живёт доменная логика, как не допустить её утечки между модулями и куда помещать новые бизнес-правила.

---

## 1. Принцип: доменная логика — в доменных объектах

Любое бизнес-правило должно жить в одном из доменных объектов (`src/domain/`). Слои `api` (UseCase) и `ui` (Story, Controller) **НЕ содержат** доменной логики — они только оркестрируют вызовы доменных объектов и инфраструктуры (репозитории, фасады).

Доменные объекты можно импортировать и использовать из любого слоя (api, ui) и из других доменных модулей напрямую — без UC, без `appApi.execute()`.

### Мутирующие доменное состояние методы

Любое действие приводящее к мутации состояния агрегата должно выполняться только в UC своего модуля.

Мутация производится только через агрегат.

### Немутирующие доменное состояние методы

Можно импортировать и использовать методы:
- **Агрегат (Ar)** — использование read методов;
- **Политика (Policy)** — синхронные проверки прав
- **Доменный сервис (Ds)** — чистые read функции, координирующие несколько агрегатов
- **Схема (Schema)** — валидационные схемы Valibot
- **Entity-типы** — `User`, `Course`, `Student`, `Stream` и т.д.

---

## 2. Куда помещать доменную логику

Выбирай объект по области ответственности. Правило: **ближе к данным, которыми оперирует правило.**

| Объект | Область ответственности | Пример |
|--------|------------------------|--------|
| **Агрегат (Ar)** | Логика в пределах одного агрегата. Инварианты, переходы состояний, мутации | `StudentAr.advance()`: `active → advanced` |
| **Доменный сервис (Ds)** | Логика, координирующая несколько агрегатов **одного модуля**. Stateless. | `StreamDs.completeStep()`: завершает шаг в `StudentAr` и находит следующий в `StreamAr` |
| **Политика (Policy)** | Проверка прав доступа. Может принимать агрегаты из других модулей. Stateless, синхронно, возвращает `boolean` | `CoursePolicy.canEdit(actor, course)` |
| **Делегирование между модулями** | Если доменная логика требует данных из другого модуля: **зависимый модуль импортирует Policy/Ds вышестоящего модуля и делегирует часть проверок**. Сам оперирует только своими объектами | `StreamPolicy → CoursePolicy` (см. пример ниже) |
| **Фасад (Facade)** | Упрощённый доступ к чтению данных другого модуля (скрывает `execute()`) | `UserFacade.getUserByUuid()` |

### Антипаттерны

- ❌ Доменная логика в UseCase (if/else по статусам, проверки структуры)
- ❌ Доменная логика в Story/Controller
- ❌ Дублирование чужой доменной логики у себя («я тоже знаю, как устроены фазы курса»)
- ❌ Policy, которая лезет в структуру данных чужого модуля

---

## 3. Пример: как мы исправляли утечку в гейтинге модулей

### Задача

Реализовать гейт: студент может записаться на модуль N, только если завершил модуль N−1 со статусом `advanced`. Первый модуль курса доступен всем.

### ❌ Попытка 1: всё в StreamPolicy

```typescript
// StreamPolicy (stream) — ПЛОХО
canEnrollNextModule(course, targetModuleId, prevModuleStatus): boolean {
  const allModuleIds = course.phases.flatMap(p => p.moduleIds); // ← знание о структуре курса
  const idx = allModuleIds.indexOf(targetModuleId);
  if (idx === 0) return true;                                   // ← курс-логика в stream
  return prevModuleStatus === 'advanced';
}
```

**Проблема:** StreamPolicy знает о `course.phases`, `moduleIds`, порядке фаз. Логика структуры курса утекла из `course` в `stream`.

### ❌ Попытка 2: технические методы в CoursePolicy

```typescript
// CoursePolicy (course) — ПЛОХО
hasModule(course, moduleId): boolean { ... }      // технический, не доменный
isEntryModule(course, moduleId): boolean { ... }  // технический, не доменный
```

**Проблема:** имена методов описывают структуру данных, а не доменное решение. Policy должна отвечать на вопрос «можно ли?», а не «где находится?».

### ✅ Итоговое решение

```typescript
// CoursePolicy (course) — доменное решение о допуске
canEnrollNextModule(course, targetModuleId, completedModuleIds: string[]): boolean {
  const allModuleIds = course.phases.flatMap(p => p.moduleIds);
  const idx = allModuleIds.indexOf(targetModuleId);
  if (idx === -1) return false;          // модуль не в курсе
  if (idx === 0) return true;            // входной — без пререквизитов
  return completedModuleIds.includes(allModuleIds[idx - 1]);
}

// StreamPolicy (stream) — оперирует своими объектами, делегирует в CoursePolicy
canEnrollNextModule(course, targetModuleId, students: Student[], streams: Stream[]): boolean {
  const streamMap = new Map(streams.map(s => [s.uuid, s.moduleId]));
  const completedModuleIds = students
    .filter(s => s.status === 'advanced')
    .map(s => streamMap.get(s.streamId))
    .filter((id): id is string => id !== undefined);

  return CoursePolicy.canEnrollNextModule(course, targetModuleId, completedModuleIds);
}
```

**Почему это правильно:**

- **StreamPolicy** оперирует **своими** доменными объектами (`Student[]`, `Stream[]`), сама извлекает `completedModuleIds`
- **CoursePolicy** принимает **свои** данные (`Course`) и примитивы (`string[]`), принимает решение о допуске
- **Делегирование:** StreamPolicy вызывает CoursePolicy, передавая только необходимый минимум (moduleIds)
- UC в stream вызывает **свою** политику (`StreamPolicy`), не зная о `CoursePolicy`

---

## 4. Правила внесения новой доменной логики

1. **Определи модуль-владелец.** Чьи данные нужны для правила? Там и живёт логика.
2. **Выбери объект** по таблице из §2.
3. **Если нужны данные из другого модуля** — зависимый модуль импортирует Policy/Ds владельца и делегирует. Передавай **минимальные данные** (примитивы, ID), а не чужие сущности целиком.
4. **Не дублируй.** Если CoursePolicy уже умеет проверять порядок модулей — не пиши то же самое в StreamPolicy.
5. **Называй методы доменно.** Не `hasModule`/`isFirst`, а `canEnrollNextModule` — метод Policy отвечает на вопрос «можно ли?».

---

## 5. Связанные документы

- [DDD-принципы](./ddd.md) — описание тактических объектов
- [Архитектура](./architecture.md) — слои, импорты, межмодульное взаимодействие
- [StyleGuide: Policy](./skills/policy.md) — правила написания политик
- [StyleGuide: Aggregate](./skills/aggregate.md) — правила написания агрегатов
- [StyleGuide: Domain Service](./skills/domain-service.md) — правила написания DS
