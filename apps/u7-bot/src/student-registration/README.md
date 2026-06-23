# Временные команды регистрации студентов потока 1

## Цель

Две временные бот-команды для ручной регистрации студентов первого потока
«Основы JS. Синтаксис — 1» в системе u7-school.

**Контекст:** студенты попадали в Telegram-группу потока через инвайт-ссылку.
Не все из них зарегистрированы в системе как пользователи с ролью STUDENT.
Эти команды позволяют быстро зачислить всех студентов в поток с указанием
их текущего урока.

После использования обе команды и все связанные файлы должны быть **удалены**.

## Использование

### `/register_student [pN-lM]` — самостоятельная регистрация

Студент пишет команду в личку боту. Если урок не указан — используется `p4-l1`.

**Примеры:**
```
/register_student          — урок по умолчанию p4-l1
/register_student p2-l3    — урок 3 проекта 2
```

**Что делает:**
1. Проверяет, что студент есть в списке участников группы (или в самой группе)
2. Проверяет, что студент ещё не записан в поток
3. Создаёт запись студента с первым шагом указанного урока
4. Добавляет роль STUDENT
5. Сообщает о результате

### `/register_inactive` — массовая регистрация (только админ)

Админ пишет команду в личку боту.

**Что делает:**
1. Проверяет права ADMIN
2. Для всех 16 студентов из хардкод-списка:
   - Если нет в системе — проверяет членство в группе и создаёт пользователя
   - Если уже есть активная запись — пропускает
   - Создаёт запись студента с уроком `p1-l5` (для забросивших учёбу)
3. Выводит отчёт: «Добавлено: X, Пропущено: Y, Ошибки: Z»

## Архитектурные решения

- **Изоляция:** все файлы в папке `apps/u7-bot/src/student-registration/`.
  Не затронуты DDD-пакеты `stream`, `user`, `course`.
- **Прямые handler'ы:** команды регистрируются напрямую в `main.ts` через
  Grammy `bot.command()`, минуя `BotRouter`. Это упрощает код и удаление.
- **Хардкод-список:** 16 студентов из `maybe-member.md` (раздел 6),
  исключая Nur (админ/ментор) и U7 School Bot. Данные не меняются.
- **Консистентность данных:** Student записи создаются вручную, но поля
  полностью соответствуют типу `Student` из `@u7-scl/stream/domain`.
  Роль `STUDENT` добавляется через `UserFacade.updateUserRole`.
- **Проверка группы:** если пользователя нет в хардкод-списке, бот
  проверяет реальное членство через Telegram API `getChatMember`.

## Удаление (инструкция для агента)

После того как все студенты зарегистрированы:

### 1. Удалить папку с кодом команд
```bash
rm -rf apps/u7-bot/src/student-registration/
```

### 2. Очистить `apps/u7-bot/src/main.ts`

Удалить блок импорта (строки с пометкой `ВРЕМЕННО`):
```typescript
// ══ ВРЕМЕННО: Регистрация студентов потока 1 ══
import { STREAM_1_UUID } from './student-registration/constants';
import { registerRegisterStudentCommand } from './student-registration/register-student.handler';
import { registerRegisterInactiveCommand } from './student-registration/register-inactive.handler';
// ══ КОНЕЦ ВРЕМЕННОГО БЛОКА ══
```

Удалить блок регистрации:
```typescript
// ══ ВРЕМЕННО: Регистрация студентов потока 1 ══
const stream1 = await streamRepo.getByUuid(STREAM_1_UUID);
if (stream1) {
  registerRegisterStudentCommand(privateBot, stream1.contentSnapshot, userFacade, streamStudentRepo, loggers);
  registerRegisterInactiveCommand(privateBot, stream1.contentSnapshot, userFacade, streamStudentRepo, loggers);
  loggers.info('main', 'Временные команды register_student и register_inactive зарегистрированы');
} else {
  loggers.error('main', 'Поток 1 не найден — команды регистрации не зарегистрированы');
}
// ══ КОНЕЦ ВРЕМЕННОГО БЛОКА ══
```

Убрать `streamRepo, streamStudentRepo` из деструктуризации `createApiApp`:
```typescript
const { userFacade, router } = createApiApp(config, logger);
```

### 3. Очистить `apps/u7-bot/src/api-app.ts`

Удалить из return-объекта:
```typescript
// ══ ВРЕМЕННО: для student-registration ══
streamRepo,
streamStudentRepo,
// ══ КОНЕЦ ВРЕМЕННОГО БЛОКА ══
```

### 4. Перезапустить бота
```bash
pm2 restart u7-bot
```

### 5. Проверить логи
```bash
pm2 logs u7-bot --lines 20
```
Убедиться, что бот запустился без ошибок.
