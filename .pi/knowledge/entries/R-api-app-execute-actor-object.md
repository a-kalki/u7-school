# ApiApp.execute: контракт actor — готовый объект, а не UUID

- **Симптомы:** скрипты из `scripts/` (например, `deliver-redesign.ts`) при вызове
  `app.execute('create-lesson', cmd, NUR_UUID)` падают с ошибкой
  `❌ Ошибка: undefined is not an object (evaluating 'actor.roles.includes')`.
- **Причина:** контракт `ApiApp.execute(ucName, command, actor)` изменился: третий аргумент —
  теперь готовый actor-объект User (см. тест «ApiApp.execute() — проброс actor-объекта»,
  `packages/core/src/api/app/api-app.test.ts`), а не UUID, который резолвится внутри.
  Строка-UUID доходит до UseCase как actor, у строки нет `.roles` → падение в политике доступа.
- **Решение:** резолвить actor перед вызовом через хелпер из `scripts/_app-factory.ts`:

```ts
import { createApp, NUR_UUID, resolveActor } from './_app-factory';

const actor = await resolveActor(app, NUR_UUID);
const lesson = await app.execute('create-lesson', { ...cmd }, actor);
```

Так же делает рабочий образец — `scripts/distribute-lesson.ts` (строка ~343).
