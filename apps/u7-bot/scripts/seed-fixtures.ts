/**
 * Скрипт для dev-режима: копирует e2e-фикстуры в data-директорию
 * и привязывает DEV_TELEGRAM_ID ко всем ролям.
 *
 * Использование:
 *   DEV_TELEGRAM_ID=123456789 bun run apps/u7-bot/scripts/seed-fixtures.ts
 *
 * Что делает:
 *   1. Копирует apps/u7-bot/tests/fixtures/templates/ → data/fixtures/
 *      (включая пустые wish/ и questionnaires/ — каждый запуск даёт чистое состояние)
 *   2. Находит ментора (UUID 4444...) и привязывает к DEV_TELEGRAM_ID
 *   3. Даёт ему все роли: GUEST, STUDENT, MENTOR, AUTHOR, ADMIN
 *   4. Привязывает студента в потоке к этому же пользователю
 *   5. Оживляет фикстуры peer-review: окно кампаний пересчитывается
 *      от «сегодня», участники кампаний сохраняются в users.json
 */

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Role, type User } from '@u7-scl/user/domain';

const FIXTURES_DIR = path.resolve(
  import.meta.dir,
  '../tests/fixtures/templates',
);
const DATA_DIR = path.resolve(import.meta.dir, '../../../data/fixtures');

const MENTOR_UUID = '44444444-4444-4444-4444-444444444444';

/** Миллисекунд в сутках. */
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Живые кампании peer-review (uuid из templates/peer-review/campaigns.json).
 * Кампании вне списка при посеве уводятся в прошлое — для проверки
 * экрана-заглушки истёкшего окна и фильтра onlyLives.
 */
const LIVING_CAMPAIGN_UUIDS = new Set([
  'c1a11111-1111-4111-8111-111111111111', // dev — ментор, субъект Андрей
  'c2a22222-2222-4222-8222-222222222222', // dev — субъект (dropped)
]);

/** Формат даты-времени агрегатов peer-review — до минут (isoNow проекта). */
function isoMinute(date: Date): string {
  return date.toISOString().slice(0, 16);
}

async function main() {
  const devTelegramId = process.env.DEV_TELEGRAM_ID;
  if (!devTelegramId) {
    console.error('❌ Укажи DEV_TELEGRAM_ID — твой реальный Telegram ID');
    console.error(
      '   Пример: DEV_TELEGRAM_ID=123456789 bun run apps/u7-bot/scripts/seed-fixtures.ts',
    );
    process.exit(1);
  }

  const id = Number(devTelegramId);
  if (Number.isNaN(id) || id <= 0) {
    console.error(
      '❌ DEV_TELEGRAM_ID должен быть числом (твой Telegram user ID)',
    );
    process.exit(1);
  }

  console.log(`🔧 Настраиваю dev-окружение для Telegram ID: ${id}`);

  // 1. Копируем фикстуры
  await copyFixtures();

  // 2. Патчим users.json: привязываем ментора к dev-аккаунту, даём все роли
  await patchUsers(id);

  // 3. Патчим students.json: привязываем студента к ментору (dev-аккаунту)
  await patchStudents();

  // 4. Оживляем фикстуры peer-review: живое окно от «сегодня»
  await revitalizePeerReview();

  console.log('✅ Готово! Запускай бота:');
  console.log('   DB_DIR=./data/fixtures bun run apps/u7-bot/src/main.ts');
  console.log('');
  console.log(
    '📋 Роли dev-пользователя: GUEST, STUDENT, MENTOR, AUTHOR, ADMIN',
  );
  console.log('📋 Ты ментор потоков: JS Core Поток 1–4');
  console.log('📋 Ты студент в потоке: JS Core Поток 2 (Активный)');
}

async function copyFixtures() {
  await mkdir(path.join(DATA_DIR, 'users'), { recursive: true });
  await mkdir(path.join(DATA_DIR, 'streams'), { recursive: true });
  await mkdir(path.join(DATA_DIR, 'courses'), { recursive: true });

  await mkdir(path.join(DATA_DIR, 'wish'), { recursive: true });
  await mkdir(path.join(DATA_DIR, 'questionnaires'), { recursive: true });
  // Персистентность бота (трек bot-ui-session-persist): каждый пересев
  // даёт чистые сессии — пустые коллекции перезаписывают накопленное.
  await mkdir(path.join(DATA_DIR, 'bot'), { recursive: true });
  // Кампании/отзывы peer-review копируются отдельно — с пересчётом окна
  await mkdir(path.join(DATA_DIR, 'peer-review'), { recursive: true });

  const copies: Array<[string, string]> = [
    ['users.json', 'users/users.json'],
    ['streams.json', 'streams/streams.json'],
    ['students.json', 'streams/students.json'],
    ['courses/modules.json', 'courses/modules.json'],
    ['courses/lessons.json', 'courses/lessons.json'],
    ['courses/steps.json', 'courses/steps.json'],
    ['courses/courses.json', 'courses/courses.json'],
    ['wish/wishes.json', 'wish/wishes.json'],
    [
      'questionnaires/questionnaires.json',
      'questionnaires/questionnaires.json',
    ],
    ['bot/sessions.json', 'bot/sessions.json'],
    ['bot/short-ids.json', 'bot/short-ids.json'],
  ];

  for (const [src, dest] of copies) {
    await copyFile(path.join(FIXTURES_DIR, src), path.join(DATA_DIR, dest));
  }

  console.log('📁 Фикстуры скопированы в data/fixtures/');
}

async function patchUsers(devId: number) {
  const usersPath = path.join(DATA_DIR, 'users', 'users.json');
  const raw = await readFile(usersPath, 'utf-8');
  const users = JSON.parse(raw) as User[];

  const mentor = users.find((u) => u.uuid === MENTOR_UUID);
  if (!mentor) {
    console.error('❌ Ментор не найден в users.json');
    process.exit(1);
  }

  // Привязываем ментора к dev-аккаунту и даём все роли
  mentor.telegramId = devId;
  mentor.roles = [
    Role.GUEST,
    Role.STUDENT,
    Role.MENTOR,
    Role.AUTHOR,
    Role.ADMIN,
  ];
  mentor.name = 'Dev';

  // Удаляем остальных пользователей, чтобы избежать конфликтов.
  // Оставляем: ментора (dev-аккаунт), бот-админа (для BOT_ADMIN_UUID)
  // и участников кампаний peer-review — иначе адресаты/субъекты
  // фикстур останутся без карточек пользователей.
  const BOT_ADMIN_UUID = 'ae00f3f6-1392-4b98-b178-41c27e794b7f';
  const peerReviewUserIds = await peerReviewParticipantIds();
  const keep = new Set([MENTOR_UUID, BOT_ADMIN_UUID, ...peerReviewUserIds]);
  const filtered = users.filter((u) => keep.has(u.uuid));

  await writeFile(usersPath, JSON.stringify(filtered, null, 2));
  console.log('👤 Пользователь настроен: все роли на одном аккаунте');
}

async function patchStudents() {
  const studentsPath = path.join(DATA_DIR, 'streams', 'students.json');
  const raw = await readFile(studentsPath, 'utf-8');
  const students = JSON.parse(raw);

  // Привязываем студента к dev-аккаунту (ментору)
  for (const s of students) {
    s.userId = MENTOR_UUID; // dev-пользователь = ментор = теперь и студент
  }

  await writeFile(studentsPath, JSON.stringify(students, null, 2));
  console.log('📝 Студент привязан к dev-аккаунту');
}

/** Форма кампании peer-review (контекст stream_fate) — только нужное посеву. */
interface CampaignFixture {
  uuid: string;
  context: 'stream_fate';
  createdAt: string;
  expiresAt: string;
  subjectId: string;
  participants: string[];
  payload: { subjectOutcome: string; mentorId: string };
}

/** Прочитать шаблон кампаний peer-review. */
async function readCampaignTemplates(): Promise<CampaignFixture[]> {
  const raw = await readFile(
    path.join(FIXTURES_DIR, 'peer-review/campaigns.json'),
    'utf-8',
  );
  return JSON.parse(raw) as CampaignFixture[];
}

/** Все пользователи, на которых ссылаются кампании peer-review. */
async function peerReviewParticipantIds(): Promise<string[]> {
  const campaigns = await readCampaignTemplates();
  const ids = new Set<string>();
  for (const c of campaigns) {
    ids.add(c.subjectId);
    ids.add(c.payload.mentorId);
    for (const p of c.participants) ids.add(p);
  }
  return [...ids];
}

/**
 * Оживить фикстуры peer-review: шаблонные даты устаревают, поэтому окно
 * кампаний пересчитывается от «сегодня» — живые открываются вчера
 * (6 дней остатка), истёкшая закрывается неделю назад. Отзывы сохраняют
 * своё смещение от старта окна кампании.
 */
async function revitalizePeerReview() {
  const campaigns = await readCampaignTemplates();
  const now = Date.now();
  const newCreatedAt = new Map<string, Date>();

  for (const c of campaigns) {
    const start = LIVING_CAMPAIGN_UUIDS.has(c.uuid)
      ? new Date(now - DAY_MS) // открыта вчера — 6 дней остатка
      : new Date(now - 30 * DAY_MS); // истекла 23 дня назад
    const durationMs =
      new Date(c.expiresAt).getTime() - new Date(c.createdAt).getTime();
    const expires = new Date(start.getTime() + durationMs);
    newCreatedAt.set(c.uuid, start);
    c.createdAt = isoMinute(start);
    c.expiresAt = isoMinute(expires);
  }

  const reviewsPath = path.join(FIXTURES_DIR, 'peer-review/reviews.json');
  const reviews = JSON.parse(await readFile(reviewsPath, 'utf-8')) as Array<{
    uuid: string;
    campaignId: string;
    createdAt: string;
  }>;
  for (const r of reviews) {
    const start = newCreatedAt.get(r.campaignId);
    if (!start) {
      throw new Error(
        `Отзыв ${r.uuid} ссылается на неизвестную кампанию ${r.campaignId}`,
      );
    }
    // Все отзывы попадают в первые часы окна своей кампании
    r.createdAt = isoMinute(new Date(start.getTime() + 6 * 60 * 60 * 1000));
  }

  await writeFile(
    path.join(DATA_DIR, 'peer-review/campaigns.json'),
    JSON.stringify(campaigns, null, 2),
  );
  await writeFile(
    path.join(DATA_DIR, 'peer-review/reviews.json'),
    JSON.stringify(reviews, null, 2),
  );
  console.log('🏁 Peer-review: окно кампаний пересчитано от сегодня');
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
