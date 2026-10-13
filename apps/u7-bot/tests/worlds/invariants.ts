import type { StudentOutcome } from '@u7-scl/peer-review/domain';
import type { Stream } from '@u7-scl/stream/domain';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { WorldState } from './types';

/** Нарушение инварианта мира */
export interface InvariantViolation {
  code: string;
  message: string;
  entity: string;
  id: string;
}

/** Сопоставление исхода кампании и допустимых статусов студента */
const OUTCOME_TO_STATUSES: Record<StudentOutcome, string[]> = {
  completed_passed: ['advanced', 'active'],
  completed_not_passed: ['not_advanced'],
  dropped: ['abandoned', 'active'],
  never_started: ['enrolled'],
};

/**
 * Валидирует все инварианты WorldState и возвращает список нарушений.
 */
export function checkWorldInvariants(state: WorldState): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  const usersById = new Map<string, User>(state.users.map((u) => [u.uuid, u]));
  const streamsById = new Map<string, Stream>(
    state.streams.map((s) => [s.uuid, s]),
  );

  // 1. Инварианты роли и статуса студента
  for (const st of state.students) {
    const user = usersById.get(st.userId);
    if (!user) {
      violations.push({
        code: 'STUDENT_USER_NOT_FOUND',
        message: `Студент ${st.uuid} ссылается на неизвестного пользователя ${st.userId}`,
        entity: 'Student',
        id: st.uuid,
      });
      continue;
    }

    const hasStudentRole = user.roles.some((r) => r === Role.STUDENT);
    if (st.status === 'active' && !hasStudentRole) {
      violations.push({
        code: 'STUDENT_ROLE_MISMATCH',
        message: `Пользователь "${user.name}" (${user.uuid}) учится в активном потоке со статусом "${st.status}", но не имеет роли STUDENT (роли: ${user.roles.join(', ')})`,
        entity: 'User',
        id: user.uuid,
      });
    }

    // Хронология: регистрация пользователя <= зачисление студента
    const userCreated = new Date(user.createdAt).getTime();
    const enrolled = new Date(st.enrolledAt).getTime();
    if (userCreated > enrolled) {
      violations.push({
        code: 'CHRONOLOGY_REGISTRATION_AFTER_ENROLLMENT',
        message: `Дата регистрации пользователя "${user.name}" (${user.createdAt}) позже даты зачисления в поток (${st.enrolledAt})`,
        entity: 'Student',
        id: st.uuid,
      });
    }

    // Хронология: если студент уже учится / завершил поток, его регистрация не может быть позже старта потока
    const streamEntity = streamsById.get(st.streamId);
    if (streamEntity && st.status !== 'enrolled') {
      const streamStart = new Date(streamEntity.startDate).getTime();
      if (userCreated > streamStart) {
        violations.push({
          code: 'CHRONOLOGY_REGISTRATION_AFTER_STREAM_START',
          message: `Дата регистрации пользователя "${user.name}" (${user.createdAt}) позже старта потока "${streamEntity.title}" (${streamEntity.startDate})`,
          entity: 'Student',
          id: st.uuid,
        });
      }
    }
  }

  // 2. Инвариант роли ментора потока
  for (const s of state.streams) {
    const mentor = usersById.get(s.mentorId);
    if (!mentor) {
      violations.push({
        code: 'STREAM_MENTOR_NOT_FOUND',
        message: `Поток "${s.title}" ссылается на неизвестного ментора ${s.mentorId}`,
        entity: 'Stream',
        id: s.uuid,
      });
      continue;
    }

    const hasMentorRole = mentor.roles.some((r) => r === Role.MENTOR);
    if (!hasMentorRole) {
      violations.push({
        code: 'MENTOR_ROLE_MISMATCH',
        message: `Ментор "${mentor.name}" (${mentor.uuid}) ведёт поток "${s.title}", но не имеет роли MENTOR (роли: ${mentor.roles.join(', ')})`,
        entity: 'Stream',
        id: s.uuid,
      });
    }
  }

  // 3. Инвариант роли автора курса
  for (const c of state.courses) {
    const author = usersById.get(c.authorId);
    if (author) {
      const hasAuthorRole = author.roles.some((r) => r === Role.AUTHOR);
      if (!hasAuthorRole) {
        violations.push({
          code: 'AUTHOR_ROLE_MISMATCH',
          message: `Автор "${author.name}" курса "${c.title}" не имеет роли AUTHOR`,
          entity: 'Course',
          id: c.uuid,
        });
      }
    }
  }

  // 4. Инварианты кампаний отзывов
  for (const cmp of state.campaigns) {
    // 4.1. Окно кампании: createdAt < expiresAt
    const createdTime = new Date(cmp.createdAt).getTime();
    const expiresTime = new Date(cmp.expiresAt).getTime();
    if (expiresTime <= createdTime) {
      violations.push({
        code: 'CAMPAIGN_WINDOW_INVALID',
        message: `Окно кампании ${cmp.uuid}: дата закрытия (${cmp.expiresAt}) не позже даты создания (${cmp.createdAt}) (expiresAt <= createdAt)`,
        entity: 'ReviewCampaign',
        id: cmp.uuid,
      });
    }

    // 4.2. Связь со студентом: согласованность исхода и даты
    const st = state.students.find(
      (s) => s.streamId === cmp.scopeId && s.userId === cmp.subjectId,
    );
    if (!st) {
      const stream = streamsById.get(cmp.scopeId);
      if (stream?.status === 'completed' || stream?.status === 'archived') {
        continue;
      }
      violations.push({
        code: 'CAMPAIGN_SUBJECT_NOT_FOUND',
        message: `Субъект кампании ${cmp.subjectId} не найден среди студентов потока ${cmp.scopeId}`,
        entity: 'ReviewCampaign',
        id: cmp.uuid,
      });
      continue;
    }

    // Согласованность исхода кампании и статуса студента
    const outcome = cmp.payload.subjectOutcome;
    const allowed = OUTCOME_TO_STATUSES[outcome];
    if (!allowed?.includes(st.status)) {
      violations.push({
        code: 'CAMPAIGN_FATE_MISMATCH',
        message: `Судьба кампании "${outcome}" противоречит статусу студента "${st.status}" (ожидалось: ${allowed?.join(', ')})`,
        entity: 'ReviewCampaign',
        id: cmp.uuid,
      });
    }

    // Хронология: кампания не может быть создана раньше зачисления студента
    const enrolledTime = new Date(st.enrolledAt).getTime();
    if (createdTime < enrolledTime) {
      violations.push({
        code: 'CAMPAIGN_CREATED_BEFORE_ENROLLMENT',
        message: `Окно кампании (${cmp.createdAt}) создано раньше зачисления/исхода студента (${st.enrolledAt})`,
        entity: 'ReviewCampaign',
        id: cmp.uuid,
      });
    }
  }

  return violations;
}

/**
 * Проверяет все инварианты WorldState и выбрасывает ошибку при первом нарушении.
 */
export function assertWorldInvariants(state: WorldState): void {
  const violations = checkWorldInvariants(state);
  const first = violations[0];
  if (first) {
    throw new Error(`Инвариант нарушен [${first.code}]: ${first.message}`);
  }
}
