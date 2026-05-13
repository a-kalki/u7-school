---
name: ddd-infra
description: Правила и шаблоны для Infra-слоя — реализация репозиториев и БД. Используй при создании или изменении файлов в src/infra/.
---

# DDD Infra Layer — Styleguide

## Директива

Ты ДОЛЖЕН следовать этим правилам при создании или изменении файлов инфраструктурного слоя (`src/infra/`).

Покрытие тестами должно гарантировать правильную работу.

## Карта файлов

Ниже — соответствие паттернов, файлов в проекте и полных styleguide-файлов с примерами кода.
Если нужен полный пример — прочитай указанный styleguide-файл.

| Паттерн | Файл в проекте | Полный styleguide |
|---|---|---|
| Repo (реализация) | `infra/db/<entity>-<type>-repo.ts` | `conductor/code_styleguides/skills/repo-impl.md` |
| Db (БД) | `packages/core/src/infra/base-json-db.ts` | — |

---

## 1. Db (База данных) — `BaseJsonDb`

**Назначение:** управление JSON-файлами с поддержкой транзакций. Один экземпляр на модуль.

### Ключевые правила
1. Один `Db` на модуль, знает все `Repo` при создании.
2. Передаётся в resolver (DI).
3. `JsonFileRepo` принимает `BaseJsonDb` + имя коллекции опционально.
4. UseCase использует `db.begin()` / `db.commit()` / `db.rollback()` для атомарных операций.
5. Без транзакций — репозитории пишут напрямую на диск.

### Пример
```typescript
const db = new BaseJsonDb();
const courseRepo = new CourseJsonRepo(db, "courses");
const lessonRepo = new LessonJsonRepo(db, "lessons");

// В usecase:
db.begin();
try {
  await courseRepo.save(course.state);
  await lessonRepo.save(lesson.state);
  await db.commit();
} catch (e) {
  db.rollback();
  throw e;
}
```

---

## 2. Repo (реализация) — `infra/db/<entity>-<type>-repo.ts`

**Назначение:** конкретная реализация доменного интерфейса `Repo`. Например: `UserSqliteRepo`, `UserInmemoryRepo`.

### Ключевые правила
1. `implements` доменный `Repo`-интерфейс из `domain/<entity>/repo.ts`.
2. **Без бизнес-логики** — только хранение и извлечение данных.
3. Имя класса: `<EntityName><Type>Repo` (например, `UserSqliteRepo`).
4. Использует конкретную технологию хранения (SQLite, in-memory, REST).
5. Отличное покрыт тестами гарантирующий выполнение контрактов методов.

---

## Предотвращение регресса

- **Не ломай существующее** — меняй только то, что относится к задаче.
- **Не удаляй и не переписывай тесты** — только добавляй новые.
- **Критические ошибки вне задачи** — задокументируй в отчёте, не исправляй без согласования.
