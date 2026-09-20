import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { assertMarkdownV2Safe, type MdText } from '@u7-scl/core/shared';
import type { StudentCampaignCreatedEvent } from '@u7-scl/peer-review/domain';
import { InviteStory } from './invite.story';

// ══ Фикстуры ══

const CAMPAIGN_ID = 'aaaaaaaa-0000-4000-8000-000000000001';
const STREAM_ID = 'bbbbbbbb-0000-4000-8000-000000000002';
const SUBJECT_ID = 'dddddddd-0000-4000-8000-000000000003';
const MENTOR_ID = 'eeeeeeee-0000-4000-8000-000000000004';

const SUBJECT_TG = 1001;
const MENTOR_TG = 2002;

const stream = {
  uuid: STREAM_ID,
  title: 'JavaScript Основы — Поток 1',
};

type Profile = Omit<User, 'telegramId'> & { telegramId?: number };

const subject: Profile = {
  uuid: SUBJECT_ID,
  name: 'Борис',
  telegramId: SUBJECT_TG,
  roles: [],
  createdAt: '2026-01-01T00:00',
};

const mentor: Profile = {
  uuid: MENTOR_ID,
  name: 'Марина',
  telegramId: MENTOR_TG,
  roles: [],
  createdAt: '2026-01-01T00:00',
};

function makeCreatedEvent(
  overrides: Partial<StudentCampaignCreatedEvent['payload']> = {},
): StudentCampaignCreatedEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'student-campaign.created',
    occurredAt: '2026-09-21T12:00',
    aggregateName: 'ReviewCampaign',
    aggregateId: CAMPAIGN_ID,
    payload: {
      campaignId: CAMPAIGN_ID,
      context: 'stream_fate',
      scopeId: STREAM_ID,
      subjectId: SUBJECT_ID,
      mentorId: MENTOR_ID,
      subjectOutcome: 'completed_passed',
      ...overrides,
    },
  };
}

// ══ Сборка стори с моками ══

interface InviteCall {
  telegramId: number;
  payload: {
    text: MdText;
    keyboard: { rows: Array<Array<{ text: string; code: string }>> };
  };
}

function setupStory(
  opts: {
    stream?: typeof stream | undefined;
    subject?: Profile | undefined;
    mentor?: Profile | undefined;
  } = {},
): {
  story: InviteStory;
  invites: InviteCall[];
  execute: ReturnType<typeof mock>;
} {
  // Явно переданный undefined — «недоступен»; не передан — дефолт
  const localStream = 'stream' in opts ? opts.stream : stream;
  const localSubject = 'subject' in opts ? opts.subject : subject;
  const localMentor = 'mentor' in opts ? opts.mentor : mentor;

  const invites: InviteCall[] = [];

  const execute = mock(
    async (name: string, params?: Record<string, unknown>) => {
      if (name === 'get-stream') {
        if (!localStream) throw new Error('Поток не найден');
        return localStream;
      }
      if (name === 'get-users-by-ids') {
        const ids = (params?.userIds ?? []) as string[];
        return [localSubject, localMentor].filter(
          (u): u is Profile => u !== undefined && ids.includes(u.uuid),
        );
      }
      return undefined;
    },
  );

  const story = new InviteStory();
  Object.assign(story, {
    appApi: { execute },
    proactiveSender: {
      invite: mock(
        async (telegramId: number, payload: InviteCall['payload']) => {
          invites.push({ telegramId, payload });
        },
      ),
    },
  } as unknown);

  return { story, invites, execute };
}

/** Обработчик подписки student-campaign.created. */
function campaignCreatedHandler(
  story: InviteStory,
): (event: StudentCampaignCreatedEvent) => Promise<void> {
  const sub = story
    .getEventSubscriptions()
    .find((s) => s.eventName === 'student-campaign.created');
  if (!sub) throw new Error('Подписка student-campaign.created не найдена');
  return sub.handle as (event: StudentCampaignCreatedEvent) => Promise<void>;
}

describe('InviteStory — приглашения по созданию кампании (S01)', () => {
  test('подписана на student-campaign.created', () => {
    const { story } = setupStory();
    const names = story.getEventSubscriptions().map((s) => s.eventName);
    expect(names).toContain('student-campaign.created');
  });

  test('два приглашения: субъекту и ментору — по одному каждому', async () => {
    const { story, invites } = setupStory();

    await campaignCreatedHandler(story)(makeCreatedEvent());

    expect(invites).toHaveLength(2);
    expect(invites.map((i) => i.telegramId).sort()).toEqual([
      SUBJECT_TG,
      MENTOR_TG,
    ]);
    // Одно приглашение каждому получателю
    expect(new Set(invites.map((i) => i.telegramId)).size).toBe(2);
  });

  test('субъект «completed_passed»: «об одногруппниках и менторе», заголовок с потоком', async () => {
    const { story, invites } = setupStory();

    await campaignCreatedHandler(story)(
      makeCreatedEvent({ subjectOutcome: 'completed_passed' }),
    );

    const toSubject = invites.find((i) => i.telegramId === SUBJECT_TG)!;
    assertMarkdownV2Safe(toSubject.payload.text);
    const text = String(toSubject.payload.text);
    expect(text).toContain('Отзывы по потоку «JavaScript Основы — Поток 1»');
    expect(text).toContain(
      'Поделитесь впечатлениями об одногруппниках и менторе — это часть цифрового профиля каждого\\. Пишите только правду\\.',
    );
  });

  test('субъект «completed_not_passed»: тот же текст (один на оба исхода «завершил»)', async () => {
    const { story, invites } = setupStory();

    await campaignCreatedHandler(story)(
      makeCreatedEvent({ subjectOutcome: 'completed_not_passed' }),
    );

    const text = String(
      invites.find((i) => i.telegramId === SUBJECT_TG)!.payload.text,
    );
    expect(text).toContain('об одногруппниках и менторе');
    expect(text).not.toContain('о менторе и учёбе');
  });

  test('субъект «dropped»: «о менторе и учёбе»', async () => {
    const { story, invites } = setupStory();

    await campaignCreatedHandler(story)(
      makeCreatedEvent({ subjectOutcome: 'dropped' }),
    );

    const text = String(
      invites.find((i) => i.telegramId === SUBJECT_TG)!.payload.text,
    );
    expect(text).toContain(
      'Поделитесь впечатлениями о менторе и учёбе — это поможет школе и тем, кто только выбирает, учиться ли\\. Пишите только правду\\.',
    );
    expect(text).not.toContain('об одногруппниках');
  });

  test('субъект «never_started»: «о менторе и учёбе»', async () => {
    const { story, invites } = setupStory();

    await campaignCreatedHandler(story)(
      makeCreatedEvent({ subjectOutcome: 'never_started' }),
    );

    const text = String(
      invites.find((i) => i.telegramId === SUBJECT_TG)!.payload.text,
    );
    expect(text).toContain('о менторе и учёбе');
    expect(text).not.toContain('об одногруппниках');
  });

  test('ментор: «Выдайте свой отзыв для {Имя}» — с именем субъекта', async () => {
    const { story, invites } = setupStory();

    await campaignCreatedHandler(story)(makeCreatedEvent());

    const toMentor = invites.find((i) => i.telegramId === MENTOR_TG)!;
    assertMarkdownV2Safe(toMentor.payload.text);
    const text = String(toMentor.payload.text);
    expect(text).toContain('Отзывы по потоку «JavaScript Основы — Поток 1»');
    expect(text).toContain(
      'Выдайте свой отзыв для Борис: как он проявлялся в учёбе, что удалось, что стоит подтянуть\\. Пишите только правду\\.',
    );
  });

  test('кнопка «💬 Отзывы» у обоих — полный код в S03 кампании', async () => {
    const { story, invites } = setupStory();

    await campaignCreatedHandler(story)(makeCreatedEvent());

    for (const invite of invites) {
      const buttons = invite.payload.keyboard.rows.flat();
      expect(buttons).toHaveLength(1);
      expect(buttons[0]!.text).toBe('💬 Отзывы');
      expect(buttons[0]!.code).toBe(`peer-review:campaign:list:${CAMPAIGN_ID}`);
    }
  });

  test('профили обоих получателей — один batch-UC get-users-by-ids', async () => {
    const { story, execute } = setupStory();

    await campaignCreatedHandler(story)(makeCreatedEvent());

    expect(execute).toHaveBeenCalledWith('get-users-by-ids', {
      userIds: [SUBJECT_ID, MENTOR_ID],
    });
  });

  test('у субъекта нет telegramId → только менторское приглашение', async () => {
    const { story, invites } = setupStory({
      subject: { ...subject, telegramId: undefined },
    });

    await campaignCreatedHandler(story)(makeCreatedEvent());

    expect(invites).toHaveLength(1);
    expect(invites[0]!.telegramId).toBe(MENTOR_TG);
  });

  test('ментор недоступен → приглашение только субъекту', async () => {
    const { story, invites } = setupStory({ mentor: undefined });

    await campaignCreatedHandler(story)(makeCreatedEvent());

    expect(invites).toHaveLength(1);
    expect(invites[0]!.telegramId).toBe(SUBJECT_TG);
  });

  test('имя субъекта не найдено (batch пуст) — запасной лейбл «для студента»', async () => {
    const { story, invites } = setupStory({
      subject: { ...subject, name: 'Борис' },
    });
    // batch не находит субъекта: перекроем мок — вернёт только ментора
    Object.assign(story, {
      appApi: {
        execute: mock(async (name: string) => {
          if (name === 'get-stream') return stream;
          if (name === 'get-users-by-ids') return [mentor];
          return undefined;
        }),
      },
    } as unknown);

    await campaignCreatedHandler(story)(makeCreatedEvent());

    const text = String(
      invites.find((i) => i.telegramId === MENTOR_TG)!.payload.text,
    );
    expect(text).toContain('Выдайте свой отзыв для студента:');
  });

  test('поток недоступен → приглашения не отправляются, ошибки нет', async () => {
    const { story, invites } = setupStory({ stream: undefined });

    await campaignCreatedHandler(story)(makeCreatedEvent());

    expect(invites).toHaveLength(0);
  });

  test('название потока с точками — экранирование MarkdownV2', async () => {
    const { story, invites } = setupStory({
      stream: { ...stream, title: 'Поток v1.2' },
    });

    await campaignCreatedHandler(story)(makeCreatedEvent());

    const text = String(invites[0]!.payload.text);
    expect(text).toContain('Поток v1\\.2');
    assertMarkdownV2Safe(invites[0]!.payload.text);
  });
});
