import * as v from 'valibot';

/**
 * Роли пользователей платформы u7-school.
 * - GUEST: гость, только что начавший взаимодействие с ботом
 * - SUBSCRIBER: подписчик Telegram-канала
 * - CANDIDATE: кандидат на обучение, заполнивший анкету
 * - STUDENT: ученик, проходящий обучение
 * - MENTOR: наставник, создающий курсы и проверяющий задания
 * - ADMIN: администратор платформы
 */
export enum Role {
  GUEST = 'GUEST',
  SUBSCRIBER = 'SUBSCRIBER',
  CANDIDATE = 'CANDIDATE',
  STUDENT = 'STUDENT',
  MENTOR = 'MENTOR',
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
    Role.ADMIN,
  ],
  `Недопустимая роль. Ожидается: ${Object.keys(Role).join(',')}`,
);
