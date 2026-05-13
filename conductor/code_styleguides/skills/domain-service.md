# Domain Service — Styleguide

## Директива

Domain Service (Ds) — доменный объект, координирующий работу нескольких агрегатов.
Не работает с репозиториями напрямую — принимает и возвращает объекты агрегатов (или их состояния).

## Ключевые правила

1. **Один Ds на модуль.** Расположение: `<module>/domain/<module-name>-ds.ts`.
2. **Класс `<Module>Ds`, конструктор пустой.** Без зависимостей.
3. **Не работает с репозиториями.** Только с агрегатами и их состояниями.
4. **Методы доменно-ориентированные.** Названия отражают бизнес-операции (например, `createLesson`).
5. **Возвращает plain-объект с изменёнными агрегатами.** UseCase сохраняет их в БД.
6. **UseCase использует транзакции** для атомарного сохранения всех изменённых агрегатов.

## Пример

```typescript
// course/src/domain/course-ds.ts
import { CourseAr } from "./course/a-root";
import { LessonAr } from "./lesson/a-root";
import type { CreateLessonCmd } from "./lesson/commands/create-lesson-cmd";

export class CourseDs {
  /**
   * Создаёт урок и добавляет его в проект курса.
   * Возвращает изменённые агрегаты для сохранения в БД.
   */
  createLesson(
    course: CourseAr,
    cmd: CreateLessonCmd,
    projectId: string,
  ): { course: CourseAr; lesson: LessonAr } {
    const project = course.getProject(projectId);
    if (!project) {
      course.throwInternal("Проект не найден в курсе");
    }

    const lesson = LessonAr.create(cmd);
    course.addLessonToProject(projectId, lesson.state.uuid);

    return { course, lesson };
  }
}
```

## Использование в UseCase

```typescript
async execute(command: CreateLessonCmd, actorId: string): Promise<Lesson> {
  // ... проверка прав ...

  const courseAr = new CourseAr(courseState);
  const ds = new CourseDs();
  const { course, lesson } = ds.createLesson(courseAr, command, command.projectId);

  const db = this.resolve.db;
  if (db) {
    db.begin();
    try {
      await this.resolve.courseRepo.save(course.state);
      await this.resolve.lessonRepo.save(lesson.state);
      await db.commit();
    } catch (e) {
      db.rollback();
      throw e;
    }
  }

  return lesson.state;
}
```

## Именование

| Концепт | Шаблон | Пример |
|---|---|---|
| Domain Service | `<Module>Ds` | `CourseDs` |
| Файл | `<module>-ds.ts` | `course-ds.ts` |
