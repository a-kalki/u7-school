import * as v from 'valibot';

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
