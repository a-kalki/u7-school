import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppException } from '@u7-scl/core/domain';
import {
  assertDialogResponseMarkdownSafe,
  type BotSession,
  type DialogResponse,
} from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { Routes } from '../../shared/routes';
import { CampaignStory } from './campaign.story';

describe('CampaignStory (S03 — список адресатов)', () => {
  const CAMPAIGN_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
  const STREAM_ID = 'bbbbbbbb-0000-0000-0000-000000000001';
  const MENTOR_ID = 'cccccccc-0000-0000-0000-000000000001';
  const PEER_ID = 'dddddddd-0000-0000-0000-000000000001';

  const session: BotSession = {
    dialog: { path: 'peer-review/campaign', seq: 1 },
  };
  const actor: User = {
    uuid: 'user-1',
    name: 'Аня',
    telegramId: 123,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const NAMES: Record<string, string> = {
    [MENTOR_ID]: 'Пётр Петров',
    [PEER_ID]: 'Борис',
  };

  interface RecipientView {
    userId: string;
    hasMyReview: boolean;
  }

  function makeAppApi(
    recipients: RecipientView[],
    myRole: 'subject' | 'mentor' = 'subject',
    failUc?: string,
    myReviewText?: string,
    failWindow?: boolean,
    myOutcome?:
      | 'completed_passed'
      | 'completed_not_passed'
      | 'dropped'
      | 'never_started',
  ) {
    return {
      execute: mock(async (ucName: string, attrs: Record<string, unknown>) => {
        if (failWindow && ucName === 'create-review') {
          throw new AppException({
            name: 'REVIEW_WINDOW_CLOSED',
            level: 'domain',
            kind: 'conflict',
            message: 'Окно отзывов закрыто',
            payload: {
              campaignId: CAMPAIGN_ID,
              expiresAt: '2026-09-19T00:00',
            },
          });
        }
        if (ucName === failUc) {
          throw new Error('имитация ошибки UC');
        }
        switch (ucName) {
          case 'get-campaign-recipients':
            return {
              campaignId: CAMPAIGN_ID,
              myRole,
              mentorId: MENTOR_ID,
              // исход субъекта — тексты S03/S05 по парам «роль-судьба»
              subjectOutcome: myOutcome ?? 'completed_passed',
              daysLeft: 5,
              recipients,
            };
          case 'get-my-campaigns':
            return [
              {
                campaignId: CAMPAIGN_ID,
                context: 'stream_fate',
                scopeId: STREAM_ID,
                subjectId: actor.uuid,
                myRole,
                expiresAt: '2026-09-26T00:00',
                daysLeft: 5,
                progress: { done: 1, total: recipients.length },
              },
            ];
          case 'create-review':
            return {
              reviewId: '10000000-0000-0000-0000-000000000001',
              campaignId: attrs.campaignId,
              recipientId: attrs.recipientId,
            };
          case 'get-my-review':
            return myReviewText === undefined
              ? { found: false }
              : { found: true, text: myReviewText };
          case 'get-stream':
            return { uuid: attrs.uuid, title: 'Поток S' };
          case 'get-user':
            return { uuid: attrs.uuid, name: NAMES[String(attrs.uuid)] ?? '' };
          default:
            throw new Error(`неизвестный UC: ${ucName}`);
        }
      }),
    };
  }

  function initStory(story: CampaignStory, api: ReturnType<typeof makeAppApi>) {
    story.init({ appApi: api } as never);
  }

  function findBtn(response: DialogResponse, needle: string) {
    return (
      response.screen?.keyboard?.rows
        .flat()
        .find((b) => b.text.includes(needle)) ?? null
    );
  }

  test('list: заголовок — поток, вопрос, остаток дней; главное меню последним рядом', async () => {
    const appApi = makeAppApi([
      { userId: MENTOR_ID, hasMyReview: false },
      { userId: PEER_ID, hasMyReview: true },
    ]);
    const story = new CampaignStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `list:${CAMPAIGN_ID}`,
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Отзывы — поток «Поток S»');
    // вводный абзац по паре «роль-судьба» (субъект, завершил)
    expect(text).toContain('Ты завершил обучение в этом потоке');
    expect(text).toContain('Отзыв одногруппникам поможет увидеть');
    expect(text).toContain('Отзыв ментору поможет понять');
    // развёрнутые метрики
    expect(text).toContain('Написано отзывов: 1 из 2');
    expect(text).toContain('Осталось времени: 5 дн');
    expect(text).toContain('О ком расскажешь');

    const rows = response.screen?.keyboard?.rows ?? [];
    const last = rows.at(-1)?.[0];
    expect(last?.code).toBe(Routes.app.mainMenu);
    // рядов ровно сколько адресатов + главное меню (отдельной «Закончить» нет)
    expect(rows.length).toBe(3);
  });

  test('list: роли в кнопках — «Ментор:»/«Студент:», ✅ только у отозванных', async () => {
    const appApi = makeAppApi([
      { userId: MENTOR_ID, hasMyReview: false },
      { userId: PEER_ID, hasMyReview: true },
    ]);
    const story = new CampaignStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `list:${CAMPAIGN_ID}`,
      actor,
      session,
    );

    const mentorBtn = findBtn(response, 'Пётр Петров');
    expect(mentorBtn?.text).toBe('Ментор — Пётр Петров');
    const peerBtn = findBtn(response, 'Борис');
    expect(peerBtn?.text).toBe('✅Одногруппник — Борис');
    expect(findBtn(response, '✅Ментор')).toBeNull();
  });

  test('list: код кнопки адресата — open с campaignId и userId адресата', async () => {
    const appApi = makeAppApi([{ userId: PEER_ID, hasMyReview: false }]);
    const story = new CampaignStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `list:${CAMPAIGN_ID}`,
      actor,
      session,
    );

    const btn = findBtn(response, 'Борис');
    expect(btn?.code).toBe(`campaign:open:${CAMPAIGN_ID}:${PEER_ID}`);
  });

  test('list: UC-вызовы — адресаты (authorId = я), поток по scopeId моей карточки, имена адресатов', async () => {
    const appApi = makeAppApi([{ userId: MENTOR_ID, hasMyReview: false }]);
    const story = new CampaignStory();
    initStory(story, appApi);

    await story.handleCallback(`list:${CAMPAIGN_ID}`, actor, session);

    const calls = (
      appApi.execute.mock.calls as unknown as Array<
        [string, Record<string, unknown>, unknown]
      >
    ).map(([ucName, attrs]) => [ucName, attrs]);
    expect(calls).toContainEqual([
      'get-campaign-recipients',
      { campaignId: CAMPAIGN_ID, authorId: actor.uuid },
    ]);
    expect(calls).toContainEqual(['get-stream', { streamId: STREAM_ID }]);
    expect(calls).toContainEqual(['get-user', { uuid: MENTOR_ID }]);
  });

  test('list: автор-ментор — адресаты-студенты, менторских кнопок нет', async () => {
    const appApi = makeAppApi(
      [{ userId: PEER_ID, hasMyReview: false }],
      'mentor',
    );
    const story = new CampaignStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `list:${CAMPAIGN_ID}`,
      actor,
      session,
    );

    expect(findBtn(response, 'Студент — Борис')).not.toBeNull();
    expect(findBtn(response, 'Ментор —')).toBeNull();
  });

  // ── S05: ввод отзыва ──

  const message = (text: string) =>
    ({ type: 'message', text, telegramId: actor.telegramId }) as const;

  test('open: студент → о студенте — подсказка, awaitInput, кнопка Пропустить', async () => {
    const appApi = makeAppApi([{ userId: PEER_ID, hasMyReview: false }]);
    const story = new CampaignStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `open:${CAMPAIGN_ID}:${PEER_ID}`,
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Начни со строки "Отзыв для Борис:"');
    expect(text).toContain('профессиональные');
    expect(text).toContain('Как с ним работать:');
    // принципы — общий блок экранов ввода
    expect(text).toContain('Характеризуй навыки, а не людей');
    // кнопка справки — рядом с Пропустить
    expect(findBtn(response, 'Как писать отзыв')).not.toBeNull();
    expect(response.awaitInput?.context).toEqual({
      campaignId: CAMPAIGN_ID,
      recipientId: PEER_ID,
    });
    const skip = findBtn(response, 'Пропустить');
    expect(skip?.code).toBe(`campaign:skip:${CAMPAIGN_ID}`);
  });

  test('open: ментор → о студенте — своя подсказка', async () => {
    const appApi = makeAppApi(
      [{ userId: PEER_ID, hasMyReview: false }],
      'mentor',
    );
    const story = new CampaignStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `open:${CAMPAIGN_ID}:${PEER_ID}`,
      actor,
      session,
    );

    expect(String(response.screen?.text ?? '')).toContain(
      'Начни со строки "Отзыв для Борис:"',
    );
    expect(String(response.screen?.text ?? '')).toContain(
      'Рекомендация по развитию:',
    );
  });

  test('open: адресат-ментор → о менторе — своя подсказка', async () => {
    const appApi = makeAppApi([{ userId: MENTOR_ID, hasMyReview: false }]);
    const story = new CampaignStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `open:${CAMPAIGN_ID}:${MENTOR_ID}`,
      actor,
      session,
    );

    const text = String(response.screen?.text ?? '');
    expect(text).toContain('Начни со строки "Отзыв для ментора:"');
  });

  test('how: справка «Как писать отзыв» — экран без awaitInput, кнопка возврата к вводу', async () => {
    const appApi = makeAppApi([{ userId: MENTOR_ID, hasMyReview: false }]);
    const story = new CampaignStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `how:${CAMPAIGN_ID}:${MENTOR_ID}`,
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Как писать отзыв');
    expect(text).toContain('Пиши о навыках и фактах');
    expect(text).toContain('Ярлык и переход на личности');
    expect(text).toContain('Как превратить ярлык в полезный отзыв');
    // справка не сбрасывает ввод: экран без нового awaitInput
    expect(response.awaitInput).toBeUndefined();
    const back = findBtn(response, 'К вводу');
    expect(back?.code).toBe(`campaign:open:${CAMPAIGN_ID}:${MENTOR_ID}`);
  });

  // ── S05: подсказки «о менторе» — варианты по исходу автора (subjectOutcome) ──

  test('open: «завершил и прошел» → о менторе — текст про «помогало учиться»', async () => {
    const appApi = makeAppApi(
      [{ userId: MENTOR_ID, hasMyReview: false }],
      'subject',
      undefined,
      undefined,
      undefined,
      'completed_passed',
    );
    const story = new CampaignStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `open:${CAMPAIGN_ID}:${MENTOR_ID}`,
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text ?? '');
    expect(text).toContain('что помогало учиться, что мешало');
    expect(text).toContain('Моя рекомендация студентам:');
    expect(text).not.toContain('Даже если итог');
  });

  test('open: «завершил и не прошел» → тот же текст, что и «прошел» (passed/not_passed — один)', async () => {
    const appApi = makeAppApi(
      [{ userId: MENTOR_ID, hasMyReview: false }],
      'subject',
      undefined,
      undefined,
      undefined,
      'completed_not_passed',
    );
    const story = new CampaignStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `open:${CAMPAIGN_ID}:${MENTOR_ID}`,
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text ?? '');
    expect(text).toContain('что помогало учиться, что мешало');
    expect(text).toContain('Моя рекомендация студентам:');
  });

  test('open: «не начал» → о менторе — текст «почему так и не начали»', async () => {
    const appApi = makeAppApi(
      [{ userId: MENTOR_ID, hasMyReview: false }],
      'subject',
      undefined,
      undefined,
      undefined,
      'never_started',
    );
    const story = new CampaignStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `open:${CAMPAIGN_ID}:${MENTOR_ID}`,
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text ?? '');
    expect(text).toContain('Начни со строки "Что остановило:"');
    expect(text).toContain('что не совпало с ожиданиями');
    expect(text).toContain('Моя рекомендация:');
    expect(text).toContain('тем, кто выбирает обучение');
  });

  test('open: «забросил» → о менторе — текст «почему забросили»', async () => {
    const appApi = makeAppApi(
      [{ userId: MENTOR_ID, hasMyReview: false }],
      'subject',
      undefined,
      undefined,
      undefined,
      'dropped',
    );
    const story = new CampaignStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `open:${CAMPAIGN_ID}:${MENTOR_ID}`,
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text ?? '');
    expect(text).toContain('почему забросил');
    expect(text).toContain('какие пожелания школе и ментору');
    expect(text).toContain('Следует ожидать от курса:');
  });

  test('ввод: короткий текст — переспрос-предупреждение без потери ввода', async () => {
    const appApi = makeAppApi([{ userId: PEER_ID, hasMyReview: false }]);
    const story = new CampaignStory();
    initStory(story, appApi);
    await story.handleCallback(
      `open:${CAMPAIGN_ID}:${PEER_ID}`,
      actor,
      session,
    );

    const dialog: BotSession = {
      dialog: {
        path: 'peer-review/campaign',
        seq: 2,
        input: { context: { campaignId: CAMPAIGN_ID, recipientId: PEER_ID } },
      },
    };
    const response = await story.handleMessage(
      message('коротко'),
      actor,
      dialog,
    );
    assertDialogResponseMarkdownSafe(response);

    expect(response.notify).not.toBeNull();
    expect(String(response.notify?.text ?? '')).toContain('10');
    // переспрос не трогает экран и ожидание ввода
    expect(response.screen).toBeUndefined();
    expect(response.awaitInput).toBeUndefined();
  });

  test('ввод: длинный текст (>3500) — просьба сократить', async () => {
    const appApi = makeAppApi([{ userId: PEER_ID, hasMyReview: false }]);
    const story = new CampaignStory();
    initStory(story, appApi);
    await story.handleCallback(
      `open:${CAMPAIGN_ID}:${PEER_ID}`,
      actor,
      session,
    );

    const dialog: BotSession = {
      dialog: {
        path: 'peer-review/campaign',
        seq: 2,
        input: { context: { campaignId: CAMPAIGN_ID, recipientId: PEER_ID } },
      },
    };
    const response = await story.handleMessage(
      message('х'.repeat(3501)),
      actor,
      dialog,
    );

    expect(String(response.notify?.text ?? '')).toContain('3500');
  });

  // ── S06: сохранение отзыва ──

  const reviewText = 'Отличный напарник, всё успел и помогал другим!';

  test('ввод: валидный текст — create-review, экран «сохранён», ✅ у адресата', async () => {
    const recipients: RecipientView[] = [
      { userId: PEER_ID, hasMyReview: false },
    ];
    const appApi = makeAppApi(recipients);
    const story = new CampaignStory();
    initStory(story, appApi);
    await story.handleCallback(
      `open:${CAMPAIGN_ID}:${PEER_ID}`,
      actor,
      session,
    );

    // после сохранения повторный список адресатов увидит ✅
    const first = recipients[0];
    if (first) {
      first.hasMyReview = true;
    }

    const dialog: BotSession = {
      dialog: {
        path: 'peer-review/campaign',
        seq: 2,
        input: { context: { campaignId: CAMPAIGN_ID, recipientId: PEER_ID } },
      },
    };
    const response = await story.handleMessage(
      message(reviewText),
      actor,
      dialog,
    );
    assertDialogResponseMarkdownSafe(response);

    const screenText = String(response.screen?.text ?? '');
    expect(screenText).toContain('Отзыв о Борис сохранён');
    expect(screenText).toContain('О ком ещё рассказать');
    const btn = findBtn(response, 'Одногруппник — Борис');
    expect(btn?.text.startsWith('✅')).toBe(true);

    const calls = (
      appApi.execute.mock.calls as unknown as Array<
        [string, Record<string, unknown>, unknown]
      >
    ).map(([ucName, attrs]) => [ucName, attrs]);
    expect(calls).toContainEqual([
      'create-review',
      {
        campaignId: CAMPAIGN_ID,
        authorId: actor.uuid,
        recipientId: PEER_ID,
        text: reviewText,
      },
    ]);
  });

  test('ввод: ошибка сохранения — реплика об ошибке, экран «сохранён» не показан', async () => {
    const appApi = makeAppApi(
      [{ userId: PEER_ID, hasMyReview: false }],
      'subject',
      'create-review',
    );
    const story = new CampaignStory();
    initStory(story, appApi);

    const dialog: BotSession = {
      dialog: {
        path: 'peer-review/campaign',
        seq: 2,
        input: { context: { campaignId: CAMPAIGN_ID, recipientId: PEER_ID } },
      },
    };
    const response = await story.handleMessage(
      message(reviewText),
      actor,
      dialog,
    );

    expect(response.screen).toBeUndefined();
    expect(response.notify).not.toBeNull();
    expect(String(response.notify?.text ?? '')).not.toContain('сохранён');
  });

  test('ввод: окно истекло — экран-заглушка, не реплика', async () => {
    const appApi = makeAppApi(
      [{ userId: PEER_ID, hasMyReview: false }],
      'subject',
      undefined,
      undefined,
      true,
    );
    const story = new CampaignStory();
    initStory(story, appApi);

    const dialog: BotSession = {
      dialog: {
        path: 'peer-review/campaign',
        seq: 2,
        input: { context: { campaignId: CAMPAIGN_ID, recipientId: PEER_ID } },
      },
    };
    const response = await story.handleMessage(
      message(reviewText),
      actor,
      dialog,
    );
    assertDialogResponseMarkdownSafe(response);

    expect(String(response.screen?.text ?? '')).toContain('уже закрыта');
    expect(findBtn(response, 'Главное меню')).not.toBeNull();
  });

  // ── S04: перезапись отзыва ──

  test('open: ✅-адресат — экран перезаписи с текущим текстом, кнопка Назад', async () => {
    const appApi = makeAppApi(
      [{ userId: PEER_ID, hasMyReview: true }],
      'subject',
      undefined,
      'старый отзыв',
    );
    const story = new CampaignStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `open:${CAMPAIGN_ID}:${PEER_ID}`,
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('✏️ Ты уже писал');
    expect(text).toContain('о Борис');
    expect(text).toContain('старый отзыв');
    expect(text).toContain('Отправь новый текст');
    // принципы — и на экране перезаписи
    expect(text).toContain('Характеризуй навыки, а не людей');
    expect(findBtn(response, 'Как писать отзыв')).not.toBeNull();
    expect(response.awaitInput?.context).toEqual({
      campaignId: CAMPAIGN_ID,
      recipientId: PEER_ID,
    });
    const back = findBtn(response, 'Назад');
    expect(back?.code).toBe(`campaign:skip:${CAMPAIGN_ID}`);
  });

  test('open: ✅-адресат — ввод заменяет текст (create-review перезапись)', async () => {
    const appApi = makeAppApi(
      [{ userId: PEER_ID, hasMyReview: true }],
      'subject',
      undefined,
      'старый отзыв',
    );
    const story = new CampaignStory();
    initStory(story, appApi);
    await story.handleCallback(
      `open:${CAMPAIGN_ID}:${PEER_ID}`,
      actor,
      session,
    );

    const dialog: BotSession = {
      dialog: {
        path: 'peer-review/campaign',
        seq: 2,
        input: { context: { campaignId: CAMPAIGN_ID, recipientId: PEER_ID } },
      },
    };
    const response = await story.handleMessage(
      message('Обновлённый отзыв, всё было отлично'),
      actor,
      dialog,
    );

    expect(String(response.screen?.text ?? '')).toContain('сохранён');
    const calls = (
      appApi.execute.mock.calls as unknown as Array<
        [string, Record<string, unknown>, unknown]
      >
    ).map(([ucName, attrs]) => [ucName, attrs]);
    expect(calls).toContainEqual([
      'create-review',
      {
        campaignId: CAMPAIGN_ID,
        authorId: actor.uuid,
        recipientId: PEER_ID,
        text: 'Обновлённый отзыв, всё было отлично',
      },
    ]);
  });

  test('open: ✅-адресат, отзыв уже не найден — обычный ввод S05', async () => {
    const appApi = makeAppApi([{ userId: PEER_ID, hasMyReview: true }]);
    const story = new CampaignStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `open:${CAMPAIGN_ID}:${PEER_ID}`,
      actor,
      session,
    );

    expect(String(response.screen?.text ?? '')).toContain(
      'Начни со строки "Отзыв для Борис:"',
    );
  });

  test('skip: возврат в список адресатов без сохранения', async () => {
    const appApi = makeAppApi([{ userId: PEER_ID, hasMyReview: false }]);
    const story = new CampaignStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `skip:${CAMPAIGN_ID}`,
      actor,
      session,
    );

    expect(String(response.screen?.text ?? '')).toContain('О ком расскажешь');
  });
});
