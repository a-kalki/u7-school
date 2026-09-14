import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { MdText } from '@u7-scl/core/shared';
import type { WishConfirmedEvent } from '@u7-scl/wish/domain';
import { WishConfirmedStory } from './wish-confirmed.story';

// ══ Фикстуры ══

const COURSE_ID = '44444444-4444-8444-8444-444444444444';
const OTHER_COURSE_ID = '55555555-5555-8555-8555-555555555555';
const USER_ID = '11111111-1111-8111-8111-111111111111';
const MENTOR_1 = '66666666-6666-8666-8666-666666666661';
const MENTOR_2 = '66666666-6666-8666-8666-666666666662';

const user: User = {
  uuid: USER_ID,
  name: 'Иван',
  telegramId: 1001,
  roles: [],
  createdAt: '2026-09-01T00:00',
};

const course = { uuid: COURSE_ID, title: 'Fullstack JS' };

const streams = [
  { mentorId: MENTOR_1, moduleId: 'module-a' },
  { mentorId: MENTOR_2, moduleId: 'module-b' },
  { mentorId: MENTOR_1, moduleId: 'module-c' }, // дубль ментора
  { mentorId: '77777777-7777-8777-8777-777777777777', moduleId: 'module-x' }, // чужой курс
];

function makeConfirmedEvent(): WishConfirmedEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'wish.confirmed',
    occurredAt: '2026-09-14T12:00',
    aggregateName: 'Wish',
    aggregateId: crypto.randomUUID(),
    payload: { userId: USER_ID, courseId: COURSE_ID },
  };
}

// ══ Сборка стори с моками ══

function setupStory(opts: { user?: User; course?: { title: string } } = {}): {
  story: WishConfirmedStory;
  notifies: Array<{ telegramId: number; payload: { text: MdText } }>;
} {
  const notifies: Array<{
    telegramId: number;
    payload: { text: MdText };
  }> = [];

  // Явно переданный undefined — «недоступен»; не передан — дефолт
  const localUser = 'user' in opts ? opts.user : user;
  const localCourse = 'course' in opts ? opts.course : course;

  const execute = mock(
    async (name: string, params?: Record<string, unknown>) => {
      if (name === 'get-user') {
        const uuid = params?.uuid as string;
        if (uuid === USER_ID) return localUser;
        if (uuid === MENTOR_1)
          return {
            uuid: MENTOR_1,
            name: 'Ментор 1',
            telegramId: 2001,
            roles: [],
            createdAt: '2026-08-01T00:00',
          };
        if (uuid === MENTOR_2)
          return {
            uuid: MENTOR_2,
            name: 'Ментор 2',
            roles: [],
            createdAt: '2026-08-01T00:00',
          }; // без telegramId
        return undefined;
      }
      if (name === 'get-course') return localCourse;
      if (name === 'list-streams') return streams;
      if (name === 'get-course-by-module') {
        const moduleId = params?.moduleId as string;
        if (['module-a', 'module-b', 'module-c'].includes(moduleId)) {
          return { uuid: COURSE_ID, title: 'Fullstack JS' };
        }
        return { uuid: OTHER_COURSE_ID, title: 'Другой курс' };
      }
      return undefined;
    },
  );

  const story = new WishConfirmedStory();
  Object.assign(story, {
    appApi: { execute },
    proactiveSender: {
      notify: mock(async (telegramId: number, payload: { text: MdText }) => {
        notifies.push({ telegramId, payload });
      }),
    },
  } as unknown);

  return { story, notifies };
}

/** Достаёт обработчик подписки по имени события */
function subHandler(
  story: WishConfirmedStory,
  eventName: string,
): (event: never) => Promise<void> {
  const sub = story
    .getEventSubscriptions()
    .find((s) => s.eventName === eventName);
  if (!sub) throw new Error(`Подписка ${eventName} не найдена`);
  return sub.handle as (event: never) => Promise<void>;
}

describe('WishConfirmedStory', () => {
  test('подписана на wish.confirmed', () => {
    const { story } = setupStory();
    const names = story.getEventSubscriptions().map((s) => s.eventName);
    expect(names).toContain('wish.confirmed');
  });

  test('рассылка всем менторам курса: имя, курс, дедупликация, фильтры', async () => {
    const { story, notifies } = setupStory();
    const handle = subHandler(story, 'wish.confirmed');

    await handle(makeConfirmedEvent() as never);

    // Ментор 2 без telegramId, автор-ментор исключается, дубль MENTOR_1 — один
    expect(notifies).toHaveLength(1);
    expect(notifies[0]!.telegramId).toBe(2001);
    const text = String(notifies[0]!.payload.text);
    expect(text).toContain('Иван');
    expect(text).toContain('Fullstack JS');
  });

  test('курс недоступен → уведомление с uuid курса, рассылка продолжается', async () => {
    const { story, notifies } = setupStory({ course: undefined });
    const handle = subHandler(story, 'wish.confirmed');

    await handle(makeConfirmedEvent() as never);

    expect(notifies).toHaveLength(1);
    // uuid экранируется MarkdownV2 (дефисы) — снимаем экранирование
    const text = String(notifies[0]!.payload.text).replaceAll('\\-', '-');
    expect(text).toContain(COURSE_ID);
  });

  test('пользователь недоступен → молчаливый пропуск', async () => {
    const { story, notifies } = setupStory({ user: undefined });
    const handle = subHandler(story, 'wish.confirmed');

    await handle(makeConfirmedEvent() as never);

    expect(notifies).toHaveLength(0);
  });
});
