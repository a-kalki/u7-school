import * as v from 'valibot';

// ══ Роли пользователей ══

/**
 * Роли пользователей платформы u7-school.
 * - GUEST: гость, только что начавший взаимодействие с ботом
 * - SUBSCRIBER: подписчик Telegram-канала
 * - CANDIDATE: кандидат на обучение, заполнивший анкету
 * - STUDENT: ученик, проходящий обучение
 * - MENTOR: наставник, проверяющий задания и ведущий потоки
 * - AUTHOR: автор программы — создаёт модули, курсы, уроки, шаги, проекты
 * - ADMIN: администратор платформы
 */
export enum Role {
  GUEST = 'GUEST',
  SUBSCRIBER = 'SUBSCRIBER',
  CANDIDATE = 'CANDIDATE',
  STUDENT = 'STUDENT',
  MENTOR = 'MENTOR',
  AUTHOR = 'AUTHOR',
  ADMIN = 'ADMIN',
}

/** Valibot-схема для валидации роли пользователя */
export const RoleSchema = v.picklist(
  [
    Role.GUEST,
    Role.SUBSCRIBER,
    Role.CANDIDATE,
    Role.STUDENT,
    Role.MENTOR,
    Role.AUTHOR,
    Role.ADMIN,
  ],
  `Недопустимая роль. Ожидается: ${Object.keys(Role).join(',')}`,
);

// ══ Сущность пользователя ══

/** Valibot-схема пользователя */
export const UserSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid('Некорректный формат UUID')),
  name: v.pipe(v.string(), v.trim(), v.nonEmpty('Имя не может быть пустым')),
  telegramId: v.pipe(
    v.number(),
    v.integer('telegramId должен быть целым числом'),
    v.minValue(1, 'telegramId должен быть положительным'),
  ),
  roles: v.pipe(
    v.array(RoleSchema),
    v.minLength(1, 'Пользователь должен иметь хотя бы одну роль'),
  ),
  createdAt: v.pipe(v.string(), v.isoDateTime('Некорректный формат даты')),
  updatedAt: v.optional(
    v.pipe(v.string(), v.isoDateTime('Некорректный формат даты')),
  ),
});

/** Тип пользователя, выведенный из схемы валидации */
export type User = v.InferOutput<typeof UserSchema>;

/** Метаданные агрегата пользователя */
export interface UserArMeta {
  name: 'User';
  label: 'Пользователь';
  errors: never;
  state: User;
}
