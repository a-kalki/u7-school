# Соглашения об именовании

## Имена файлов и папок

Все файлы и директории в проекте (`packages/`, `apps/`) используют стиль **kebab-case**:
- Правильно: `user-ar.ts`, `create-user-uc.ts`, `domain/ar/`.
- Неправильно: `UserAr.ts`, `createUserUc.ts`.

Тестовые файлы именуются как `<имя_файла>.test.ts`.

## Имена сущностей и классов

| Концепт | Шаблон имени | Пример |
|---|---|---|
| Сущность (тип) | `<Имя>` (PascalCase) | `User`, `Course` |
| Схема валидации | `<Имя>Schema` | `UserSchema`, `CourseSchema` |
| Агрегат | `<Имя>Ar` | `UserAr`, `CourseAr` |
| Политика прав | `<Имя>Policy` | `UserPolicy`, `CoursePolicy` |
| Команда модуля | `<Имя>Command` | `CreateUserCommand` |
| Сценарий использования | `<Имя><Действие>Uc` | `UserCreateUc`, `CourseDeleteUc` |


## Структура команды модуля

Объекты команд уровня модуля, передаваемые в `Module.handle()`, имеют фиксированную структуру:

```typescript
interface ModuleCommand {
  name: string;      // Имя команды литералом, например "user.create"
  attrs: unknown;    // UcMeta['input']
  actorId?: string;  // ID пользователя/актора (UUID)
}
```

## Правило именования команд (строка)

Для `commandName` рекомендуется использовать префикс модуля и действие через точку:
- `user.create`
- `auth.login`
- `course.enroll`
