/**
 * Скрипт dev-режима: сеет «реально-виртуальный мир» из e2e-фикстур.
 *
 * Мир остаётся собой: студенты и менторы — раздельные пользователи
 * (разрежение ролей не ломается), кампании — как в шаблоне. Личность
 * подменяется на входе транспорта (DEV_TELEGRAM_ID + /persona, см.
 * src/infra/dev-persona.ts), поэтому посев НЕ привязывает telegramId
 * к dev-аккаунту.
 *
 * Отличия от шаблона (только в копии data/fixtures):
 *   - users: «Ментор» → «Dev»; Марина и Олег получают роль STUDENT
 *     (в шаблоне GUEST — роли должны соответствовать месту в мире);
 *   - peer-review: живым остаётся только c1 (окно от «сегодня»),
 *     c2/c4 уводятся в истёкшие — c2 «сам себе ментор» (субъект 4444,
 *     ментор 4444) как живая кампания бессмысленна.
 *
 * Поведение посева (по умолчанию — всегда свежий мир):
 *   - `bun run seed:fixtures` — стирает data/fixtures и сеет мир заново
 *     (окна кампаний пересчитываются от «сегодня»);
 *   - `KEEP_WORLD=1 bun run seed:fixtures` — текущий мир не трогается:
 *     отзывы, написанные живьём, и ручные правки data/fixtures живут.
 *
 * Использование:
 *   bun run apps/u7-bot/scripts/seed-fixtures.ts
 *   DB_DIR=./data/fixtures DEV_TELEGRAM_ID=<твой tg> \
 *     bun run apps/u7-bot/src/main.ts
 */

import { existsSync, rmSync } from 'node:fs';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Role, type User } from '@u7-scl/user/domain';

const FIXTURES_DIR = path.resolve(
  import.meta.dir,
  '../tests/fixtures/templates',
);
const DATA_DIR = path.resolve(import.meta.dir, '../../../data/fixtures');

/** Миллисекунд в сутках. */
const DAY_MS = 24 * 60 * 60 * 1000;

const MENTOR_UUID = '44444444-4444-4444-4444-444444444444';
const MARINA_UUID = '77777777-7777-4777-8777-777777777777';
const OLEG_UUID = '88888888-8888-4888-8888-888888888888';

/**
 * Живые кампании peer-review (uuid из templates/peer-review/campaigns.json).
 * Прочие уводятся в истёкшие — проверка заглушки окна и фильтра onlyLives.
 *
 * c1: субъект Андрей (completed_passed), участники [Марина, Олег],
 * ментор Dev → Андрею — список адресатов S03 (2/3 отзывов уже есть),
 * Dev — автопровод «Отзыв об Андрей» с перезаписью.
 */
const LIVING_CAMPAIGN_UUIDS = new Set(['c1a11111-1111-4111-8111-111111111111']);

/** Формат даты-времени агрегатов peer-review — до минут (isoNow проекта). */
function isoMinute(date: Date): string {
  return date.toISOString().slice(0, 16);
}

async function main() {
  const keepWorld = process.env.KEEP_WORLD === '1';
  if (keepWorld && existsSync(DATA_DIR)) {
    console.log('🌍 KEEP_WORLD=1 — текущий мир сохранён, посев пропущен.');
    printRunHint();
    return;
  }

  console.log(
    keepWorld
      ? '🔧 KEEP_WORLD=1, но мира ещё нет — сею с нуля…'
      : '🔧 Сею dev-мир из e2e-фикстур (свежий мир; сохранить текущий: KEEP_WORLD=1)…',
  );

  // По умолчанию — полный пересев: накопленные данные не переживают запуск.
  rmSync(DATA_DIR, { recursive: true, force: true });

  await copyFixtures();
  await patchUsers();
  await revitalizePeerReview();

  console.log('✅ Мир засеян.');
  printRunHint();
  printWorldGuide();
}

async function copyFixtures() {
  for (const dir of [
    'users',
    'streams',
    'courses',
    'wish',
    'questionnaires',
    'bot',
    'peer-review',
  ]) {
    await mkdir(path.join(DATA_DIR, dir), { recursive: true });
  }

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
    ['peer-review/campaigns.json', 'peer-review/campaigns.json'],
    ['peer-review/reviews.json', 'peer-review/reviews.json'],
  ];

  for (const [src, dest] of copies) {
    await copyFile(path.join(FIXTURES_DIR, src), path.join(DATA_DIR, dest));
  }

  console.log('📁 Фикстуры скопированы в data/fixtures/');
}

/** Роли персон — по месту в мире (подмена личности подставит их тебе). */
async function patchUsers() {
  const usersPath = path.join(DATA_DIR, 'users', 'users.json');
  const users = JSON.parse(await readFile(usersPath, 'utf-8')) as User[];
  const byId = new Map(users.map((u) => [u.uuid, u]));

  const dev = byId.get(MENTOR_UUID);
  if (!dev) throw new Error(`Ментор ${MENTOR_UUID} не найден в users.json`);
  dev.name = 'Dev';

  // Марина и Олег — студенты Потока 2 (в шаблоне роли GUEST — для смоука)
  for (const uuid of [MARINA_UUID, OLEG_UUID]) {
    const student = byId.get(uuid);
    if (!student)
      throw new Error(`Пользователь ${uuid} не найден в users.json`);
    student.roles = [Role.STUDENT];
  }

  await writeFile(usersPath, JSON.stringify(users, null, 2));
  console.log('👤 Роли персон выданы: Dev (ментор), Марина/Олег (студенты)');
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

/**
 * Оживить фикстуры peer-review: окно кампаний пересчитывается от «сегодня» —
 * живые открываются вчера (6 дней остатка), истёкшие закрываются 23 дня назад.
 * Отзывы сохраняют своё смещение от старта окна кампании.
 */
async function revitalizePeerReview() {
  const campaigns = JSON.parse(
    await readFile(
      path.join(FIXTURES_DIR, 'peer-review/campaigns.json'),
      'utf-8',
    ),
  ) as CampaignFixture[];
  const now = Date.now();
  const newCreatedAt = new Map<string, Date>();

  for (const c of campaigns) {
    const start = LIVING_CAMPAIGN_UUIDS.has(c.uuid)
      ? new Date(now - DAY_MS) // открыта вчера — 6 дней остатка
      : new Date(now - 30 * DAY_MS); // истекла 23 дня назад
    const durationMs =
      new Date(c.expiresAt).getTime() - new Date(c.createdAt).getTime();
    newCreatedAt.set(c.uuid, start);
    c.createdAt = isoMinute(start);
    c.expiresAt = isoMinute(new Date(start.getTime() + durationMs));
  }

  const reviews = JSON.parse(
    await readFile(
      path.join(FIXTURES_DIR, 'peer-review/reviews.json'),
      'utf-8',
    ),
  ) as Array<{ uuid: string; campaignId: string; createdAt: string }>;
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
  console.log(`🏁 Peer-review: живая кампания — c1, окно от сегодня`);
}

function printRunHint() {
  console.log('');
  console.log('Запуск бота:');
  console.log(
    '  DB_DIR=./data/fixtures DEV_TELEGRAM_ID=<твой tg> bun run apps/u7-bot/src/main.ts',
  );
}

/** Карта ручных путей — что проверять каждой персоной. */
function printWorldGuide() {
  console.log(`
🎭 Персонажи (переключение: /persona <ключ> в чате бота):
  • dev    — ментор Потока 2 (и остальных): хаб → автопровод
             «Отзыв об Андрей» с уже написанным отзывом (перезапись ✏️);
             монитор потока → завершить Олега → событийная кампания
             → приглашение Олегу прилетит в чат → /persona oleg.
  • andrey — субъект живой c1: хаб → список S03 (Марина, Олег, Dev),
             2/3 отзывов уже есть (✅ и метрики «2 из 3»).
  • marina — завершившая студентка: живых кампаний нет (участник —
             адресат, не автор); S07 с отзывом о себе.
  • oleg   — одногруппник (not_advanced): адресат в списке Андрея;
             после завершения ментором — своя кампания-список.

Истёкшие кампании (заглушка окна): в хабе dev (c2, Поток 3) и
andrey (c4, Поток 3) — при открытии экран «окно закрыто».
Отзывы, написанные живьём, переживают перезапуски только с
KEEP_WORLD=1; обычный запуск сеет свежий мир.`);
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
