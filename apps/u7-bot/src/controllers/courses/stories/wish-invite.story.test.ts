import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { MdText } from '@u7-scl/core/shared';
import type { WishInvitedEvent } from '@u7-scl/wish/domain';
import { WishInviteStory } from './wish-invite.story';

// ══ Фикстуры ══

const STREAM_ID = '11111111-1111-4111-8111-111111111111';
const COURSE_ID = '44444444-4444-4444-8444-444444444444';
const MODULE_ID = '33333333-3333-4333-8333-333333333333';
const MENTOR_ID = '66666666-6666-4666-8666-666666666666';
const WISHER_TELEGRAM_ID = 1003;

const stream = {
  uuid: STREAM_ID,
  title: 'JavaScript Основы — Поток 1',
  description: 'Первый поток',
  mentorId: MENTOR_ID,
  moduleId: MODULE_ID,
  startDate: '2026-09-17T10:00:00.000Z',
  status: 'recruiting',
  contentSnapshot: [],
  createdAt: '2026-09-01T00:00',
  enrollmentKey: undefined as string | undefined,
};

const course = { uuid: COURSE_ID, title: 'JavaScript Основы' };
const module_ = { uuid: MODULE_ID, title: 'JavaScript Основы', projects: [] };

type TestMentor = Omit<User, 'telegramId'> & {
  telegramId?: number;
  nick?: string;
};

const mentor: TestMentor = {
  uuid: MENTOR_ID,
  name: 'Dev',
  nick: 'devnick',
  telegramId: 555,
  roles: [],
  createdAt: '2026-01-01T00:00',
};

function makeInvitedEvent(
  overrides: Partial<WishInvitedEvent['payload']> = {},
): WishInvitedEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'wish.invited',
    occurredAt: '2026-09-01T12:00',
    aggregateName: 'Wish',
    aggregateId: crypto.randomUUID(),
    payload: {
      userId: crypto.randomUUID(),
      telegramId: WISHER_TELEGRAM_ID,
      streamId: STREAM_ID,
      targetKind: 'course',
      courseId: COURSE_ID,
      ...overrides,
    },
  };
}

// ══ Сборка стори с моками ══

function setupStory(
  opts: {
    stream?: typeof stream | undefined;
    mentor?: TestMentor | undefined;
    course?: typeof course | undefined;
    module?: typeof module_ | undefined;
  } = {},
): {
  story: WishInviteStory;
  invites: Array<{
    telegramId: number;
    payload: {
      text: MdText;
      keyboard: { rows: Array<Array<{ text: string; code: string }>> };
    };
  }>;
  execute: ReturnType<typeof mock>;
} {
  // Явно переданный undefined — «недоступен»; не передан — дефолт
  const localStream = 'stream' in opts ? opts.stream : stream;
  const localMentor = 'mentor' in opts ? opts.mentor : mentor;

  const invites: Array<{
    telegramId: number;
    payload: {
      text: MdText;
      keyboard: { rows: Array<Array<{ text: string; code: string }>> };
    };
  }> = [];

  const execute = mock(
    async (name: string, params?: Record<string, unknown>) => {
      if (name === 'get-stream') {
        if (!localStream) {
          throw Object.assign(new Error('Поток не найден'), {
            name: 'STREAM_NOT_FOUND',
          });
        }
        return localStream;
      }
      if (name === 'get-user') {
        const uuid = params?.uuid as string;
        if (uuid === MENTOR_ID) return localMentor;
        return undefined;
      }
      if (name === 'get-course') return opts.course ?? course;
      if (name === 'get-module') return opts.module ?? module_;
      return undefined;
    },
  );

  const story = new WishInviteStory();
  Object.assign(story, {
    appApi: { execute },
    proactiveSender: {
      invite: mock(
        async (
          telegramId: number,
          payload: {
            text: MdText;
            keyboard: { rows: Array<Array<{ text: string; code: string }>> };
          },
        ) => {
          invites.push({ telegramId, payload });
        },
      ),
    },
  } as unknown);

  return { story, invites, execute };
}

/** Достаёт обработчик подписки по имени события */
function subHandler(
  story: WishInviteStory,
  eventName: string,
): (event: never) => Promise<void> {
  const sub = story
    .getEventSubscriptions()
    .find((s) => s.eventName === eventName);
  if (!sub) throw new Error(`Подписка ${eventName} не найдена`);
  return sub.handle as (event: never) => Promise<void>;
}

describe('WishInviteStory', () => {
  test('подписана на wish.invited', () => {
    const { story } = setupStory();
    const names = story.getEventSubscriptions().map((s) => s.eventName);
    expect(names).toContain('wish.invited');
  });

  test('course-приглашение: структурированная карточка с курсом, потоком, датой, ментором', async () => {
    const { story, invites } = setupStory();
    const handle = subHandler(story, 'wish.invited');

    await handle(makeInvitedEvent() as never);

    expect(invites).toHaveLength(1);
    const { telegramId, payload } = invites[0]!;
    expect(telegramId).toBe(WISHER_TELEGRAM_ID);

    const text = String(payload.text);
    // Ассоциация с кнопкой отмены
    expect(text).toContain('У тебя было желание пройти курс');
    expect(text).toContain('JavaScript Основы');
    // Имя потока — и в данных, и в подсказке записи
    expect(text).toContain('JavaScript Основы — Поток 1');
    // Дата и время старта (точки экранируются MarkdownV2)
    expect(text).toContain('17\\.09\\.2026');
    expect(text).toContain('10:00');
    // Ментор с рабочей t.me-ссылкой на ник
    expect(text).toContain('[Dev](https://t.me/devnick)');
    // Подсказка записи с явным именем потока (поток без ключа — запись свободная)
    expect(text).toContain('Запись свободная');
    expect(text).not.toContain('нужен ключ');
    expect(text).toContain('📝 Записаться');

    // Кнопки: запись на поток + отмена желания
    const buttons = payload.keyboard.rows.flat();
    const enrollBtn = buttons.find((b) => b.text.includes('Записаться'));
    expect(enrollBtn).toBeDefined();
    expect(enrollBtn!.code).toBe(`stream:view-stream:enroll:${STREAM_ID}`);
    const cancelBtn = buttons.find((b) => b.text.includes('Отменить желание'));
    expect(cancelBtn).toBeDefined();
    expect(cancelBtn!.code).toBe(`course:course-catalog:cancel:${COURSE_ID}`);
  });

  test('поток с ключом набора → подсказка про кодовое слово', async () => {
    const { story, invites } = setupStory({
      stream: { ...stream, enrollmentKey: 'secret123' },
    });
    const handle = subHandler(story, 'wish.invited');

    await handle(makeInvitedEvent() as never);

    const text = String(invites[0]!.payload.text);
    expect(text).toContain('нужен ключ — его выдаёт ментор');
    expect(text).not.toContain('Запись свободная');
  });

  test('mentor без ника → экспериментальная ссылка tg://user?id', async () => {
    const { story, invites } = setupStory({
      mentor: { ...mentor, nick: undefined },
    });
    const handle = subHandler(story, 'wish.invited');

    await handle(makeInvitedEvent() as never);

    const text = String(invites[0]!.payload.text);
    expect(text).toContain(`[Dev](tg://user?id=${mentor.telegramId})`);
  });

  test('mentor без ника и без telegramId → просто имя', async () => {
    const { story, invites } = setupStory({
      mentor: { ...mentor, nick: undefined, telegramId: undefined },
    });
    const handle = subHandler(story, 'wish.invited');

    await handle(makeInvitedEvent() as never);

    const text = String(invites[0]!.payload.text);
    expect(text).toContain('Dev');
    expect(text).not.toContain('tg://');
  });

  test('профиль ментора недоступен → строка «Ментор» опускается', async () => {
    const { story, invites } = setupStory({ mentor: undefined });
    const handle = subHandler(story, 'wish.invited');

    await handle(makeInvitedEvent() as never);

    const text = String(invites[0]!.payload.text);
    expect(text).not.toContain('Ментор');
    // Остальная карточка доставлена
    expect(text).toContain('У тебя было желание пройти курс');
  });

  test('module-приглашение: «пройти модуль», кнопка W05-M', async () => {
    const { story, invites } = setupStory();
    const handle = subHandler(story, 'wish.invited');

    await handle(
      makeInvitedEvent({
        targetKind: 'module',
        moduleId: MODULE_ID,
        courseId: undefined,
      }) as never,
    );

    const text = String(invites[0]!.payload.text);
    expect(text).toContain('У тебя было желание пройти модуль');
    expect(text).not.toContain('пройти курс');

    const buttons = invites[0]!.payload.keyboard.rows.flat();
    const cancelBtn = buttons.find((b) => b.text.includes('Отменить желание'));
    expect(cancelBtn!.code).toBe(
      `course:course-catalog:cancel-mod:${MODULE_ID}`,
    );
  });

  test('поток не найден → приглашение не отправляется, ошибки нет', async () => {
    const { story, invites } = setupStory({ stream: undefined });
    const handle = subHandler(story, 'wish.invited');

    await handle(makeInvitedEvent() as never);

    expect(invites).toHaveLength(0);
  });
});
