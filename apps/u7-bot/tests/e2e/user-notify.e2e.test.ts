import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/bot/app/app-controller';
import { MentorController } from '@u7-scl/bot/mentor/controller';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import type { Stream } from '@u7-scl/stream/domain';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';
import { UserController } from '../../src/controllers/user/controller';

/**
 * E2E механизма уведомлений userFacade.notify:
 *   1) открытие набора → желающий получает ОДНО уведомление с контекстом
 *      (поток, дата, ментор) — ER invite-wishers, FR-6 #8;
 *   2) закрытие потока на последнем модуле → студенту «🎉 Курс завершён!»
 *      — UC complete-student, FR-6 #7c;
 *   3) закрытие на модуле с следующим → уведомления нет (кнопка 7a
 *      рендерится HubStory — покрыто юнит-тестами хаба).
 *
 * Доставка — через контроллер user (сторя notify): резолв telegramId,
 * proactiveSender.notify. Стенд: TestApp + TestBotTransport.
 */

const COURSE_ID = 'fafafafa-baba-4aba-8aba-babababababa'; // Основы программирования (2 фазы)
const FIRST_MODULE = 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0'; // JavaScript Основы
const LAST_MODULE = 'a1a1a1a1-b1b1-4b1b-8b1b-b1b1b1b1b1b1'; // Алгоритмика (последняя фаза)

const MENTOR_TG = 1004;
const WISHER_TG = 1002; // «Кандидат» (SUBSCRIBER)
const STUDENT_ADV_TG = 1007; // «Студент Advanced» (прошёл a0a0a0a0)
const STUDENT_ACTIVE_TG = 1003; // «Студент» (active на e1e1e1e1, a0a0a0a0)

/** Ждёт появления проактивного сообщения адресату (poll sentMessages). */
async function waitMessageFor(
  transport: TestBotTransport,
  telegramId: number,
  timeoutMs = 3000,
): Promise<string | undefined> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = transport.api.sentMessages.find(
      (m) => m.telegramId === telegramId,
    );
    if (found) return found.text;
    await new Promise((r) => setTimeout(r, 20));
  }
  return undefined;
}

describe('E2E: механизм уведомлений userFacade.notify', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let mentor: User;
  let wisher: User;
  let studentAdvanced: User;
  let studentActive: User;

  beforeAll(async () => {
    app = await createTestApp('user-notify-e2e');
    transport = createTestBotTransport(app, [
      new AppController('https://t.me/u7_school_group'),
      new StreamsController(),
      new MentorController(),
      new UserController(),
    ]);
    mentor = (await app.userFacade.getUserByTelegramId(MENTOR_TG))!;
    wisher = (await app.userFacade.getUserByTelegramId(WISHER_TG))!;
    studentAdvanced = (await app.userFacade.getUserByTelegramId(
      STUDENT_ADV_TG,
    ))!;
    studentActive = (await app.userFacade.getUserByTelegramId(
      STUDENT_ACTIVE_TG,
    ))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('открытие набора → желающий получает одно уведомление (FR-6 #8)', async () => {
    transport.reset();

    // 1. Желающий выражает желание пройти курс
    await app.apiApp.execute(
      'create-course-wish',
      { courseId: COURSE_ID },
      wisher.uuid,
    );

    // 2. Ментор открывает набор на первый модуль курса
    const stream = (await app.apiApp.execute(
      'create-stream',
      {
        title: 'Основы JS — Поток осени',
        description: 'Набор на первый модуль',
        mentorId: mentor.uuid,
        moduleId: FIRST_MODULE,
        startDate: '2026-10-01T00:00',
      },
      mentor.uuid,
    )) as Stream;

    // 3. Желающему доставлено ровно одно уведомление с полным контекстом
    //    (текст экранируется сторей доставки — MarkdownV2)
    const text = await waitMessageFor(transport, WISHER_TG);
    expect(text).toBeDefined();
    expect(text).toContain('Открылся набор на «Основы JS — Поток осени»');
    expect(text).toContain('Старт: 01\\.10\\.2026');
    expect(text).toContain('Ментор: Ментор');
    expect(text).toContain('Для записи нужен ключ');
    expect(text).toContain('отмени желание');

    const wisherMessages = transport.api.sentMessages.filter(
      (m) => m.telegramId === WISHER_TG,
    );
    expect(wisherMessages).toHaveLength(1);
  });

  test('закрытие потока на последнем модуле → «🎉 Курс завершён!» (FR-6 #7c)', async () => {
    transport.reset();

    // 1. Ментор открывает поток на последнем модуле программы
    const stream = (await app.apiApp.execute(
      'create-stream',
      {
        title: 'Алгоритмика — Финальный поток',
        description: 'Последний модуль программы',
        mentorId: mentor.uuid,
        moduleId: LAST_MODULE,
        startDate: '2026-11-01T00:00',
      },
      mentor.uuid,
    )) as Stream;

    // 2. Студент, прошедший первый модуль, записывается (gate пройден)
    await app.apiApp.execute(
      'enroll-student',
      { streamId: stream.uuid, userId: studentAdvanced.uuid },
      studentAdvanced.uuid,
    );
    const record = (await app.apiApp.execute(
      'get-student-by-user',
      { userId: studentAdvanced.uuid },
      mentor.uuid,
    )) as unknown as { uuid: string; streamId: string };
    expect(record.streamId).toBe(stream.uuid);

    // 3. Ментор активирует поток — студент станет active с выданным шагом
    await app.apiApp.execute(
      'activate-stream',
      { streamId: stream.uuid },
      mentor.uuid,
    );

    // 4. Ментор завершает студента с исходом «прошёл»
    await app.apiApp.execute(
      'complete-student',
      { streamId: stream.uuid, studentId: record.uuid, outcome: 'advanced' },
      mentor.uuid,
    );

    // 5. Студенту доставлено поздравление с завершением курса
    const text = await waitMessageFor(transport, STUDENT_ADV_TG);
    expect(text).toBeDefined();
    expect(text).toContain('Курс завершён');
    expect(text).toContain('Поздравляем');
  });

  test('закрытие на модуле с следующим → уведомления студенту нет (кнопка 7a)', async () => {
    transport.reset();

    // Студент f0f0f0f0 (e1e1e1e1, модуль a0a0a0a0) — есть следующий модуль
    const record = (await app.apiApp.execute(
      'get-student-by-user',
      { userId: studentActive.uuid },
      mentor.uuid,
    )) as unknown as { uuid: string; streamId: string };

    await app.apiApp.execute(
      'complete-student',
      {
        streamId: record.streamId,
        studentId: record.uuid,
        outcome: 'advanced',
      },
      mentor.uuid,
    );

    // Небольшая пауза: подписки шины синхронные, но доставка асинхронна
    await new Promise((r) => setTimeout(r, 200));

    // Уведомления студенту нет — она приходит только при 7c/7d
    const noticed = transport.api.sentMessages.find(
      (m) => m.telegramId === STUDENT_ACTIVE_TG,
    );
    expect(noticed).toBeUndefined();
  });
});
