/**
 * deliver-peer-review-invites — одноразовая доставка приглашений в
 * peer-review кампании, созданные backfill-скриптом для потоков,
 * закрытых ДО выката v0.1.4 (событие student-campaign.created тогда
 * ушло «в пустоту» — UI-слой в скрипте backfill не собирался).
 *
 * ## Механика
 * Простой скрипт БЕЗ стека приложения: читает campaigns/users/streams
 * JSON и шлёт текст напрямую через Telegram Bot API (sendMessage,
 * MarkdownV2). Без кнопок — вместо них строка «Наберите /start →
 * 💬 «Отзывы»». Живой бот (pm2) не мешает: sendMessage не конфликтует
 * ни с webhook, ни с параллельной записью JSON — скрипт ничего не пишет.
 *
 * ## Кому уходит
 * - Субъекту — по каждой кампании (текст по исходу судьбы).
 * - Ментору — только по завершившим (completed_*) студентам потока
 *   «Синтаксис - 4» (решение Нурболата, 2026-09-24).
 *
 * ## Тексты
 * Скопированы 1:1 из InviteStory (S01, apps/u7-bot/.../invite.story.ts)
 * на момент доставки; вместо клавиатуры — инструкция со /start.
 *
 * ## Использование
 *   bun --env-file .env.production run scripts/deliver-peer-review-invites.ts            # dry-run
 *   bun --env-file .env.production run scripts/deliver-peer-review-invites.ts --send     # боевой
 */

import { type MdText, md, mdJoin } from '@u7-scl/core/shared';
import type { StudentOutcome } from '@u7-scl/peer-review/domain';
import { Bot } from 'grammy';

/** Поток, по завершившим студентам которого уведомляется ментор. */
const MENTOR_STREAM_ID = 'a765f732-0787-4f01-8710-7aed67b68a28'; // Синтаксис - 4

/** Пауза между сообщениями (лимиты Telegram). */
const SEND_PAUSE_MS = 150;

/** Кампании из data/peer-review/campaigns.json. */
interface Campaign {
  uuid: string;
  context: string;
  scopeId: string;
  subjectId: string;
  payload: { subjectOutcome: StudentOutcome; mentorId: string };
}

/** Профиль получателя. */
interface Profile {
  uuid: string;
  name: string;
  telegramId?: number;
}

/** Строка-инструкция вместо клавиатуры (решение Нурболата). */
const HOW_TO = md`Наберите /start → 💬 «Отзывы»`;

/** Заголовок приглашения — как в InviteStory.#header. */
function header(streamTitle: string): MdText {
  return md`🏁 *Отзывы по потоку «${streamTitle}»*`;
}

/** Текст субъекту — копия InviteStory.#subjectText + инструкция. */
function subjectText(streamTitle: string, outcome: StudentOutcome): MdText {
  const body =
    outcome === 'dropped'
      ? md`Ты покинул обучение — поделись впечатлениями о менторе и учёбе: это поможет школе и тем, кто только выбирает, учиться ли\\. Пиши только правду\\.`
      : outcome === 'never_started'
        ? md`Ты записался, но так и не начал обучение — расскажи, что остановило: это поможет школе и будущим студентам\\. Пиши только правду\\.`
        : md`Ты завершил обучение — поделись впечатлениями об одногруппниках и менторе: это часть цифрового профиля каждого\\. Пиши только правду\\.`;
  return mdJoin([header(streamTitle), md``, body, md``, HOW_TO]);
}

/** Текст ментору — копия InviteStory.#mentorText + инструкция. */
function mentorText(streamTitle: string, subjectName: string): MdText {
  const body = md`Твой подопечный ${subjectName} завершил обучение — выдай ему отзыв: как он проявлялся в учёбе, что удалось, что стоит подтянуть\\. Пиши только правду\\.`;
  return mdJoin([header(streamTitle), md``, body, md``, HOW_TO]);
}

/** Отправка с ретраем на 429 (too many requests). */
async function sendWithRetry(
  api: Bot['api'],
  telegramId: number,
  text: string,
): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await api.sendMessage(telegramId, text, { parse_mode: 'MarkdownV2' });
      return;
    } catch (err) {
      const retryAfter = (err as { parameters?: { retry_after?: number } })
        .parameters?.retry_after;
      if (retryAfter && attempt < 5) {
        console.log(`  429: пауза ${retryAfter}s (tg ${telegramId})`);
        await Bun.sleep(retryAfter * 1000);
        continue;
      }
      throw err;
    }
  }
}

async function main() {
  const doSend = process.argv.includes('--send');

  const token = process.env.BOT_TOKEN;
  if (!token)
    throw new Error('BOT_TOKEN не задан (запуск с --env-file .env.production)');

  const campaigns: Campaign[] = await Bun.file(
    'data/peer-review/campaigns.json',
  ).json();
  const users: Profile[] = await Bun.file('data/users/users.json').json();
  const streams = await Bun.file('data/streams/streams.json').json();
  const streamList = Array.isArray(streams) ? streams : Object.values(streams);

  const profiles = new Map(users.map((u) => [u.uuid, u]));
  const titles = new Map(
    streamList.map((s: { uuid: string; title: string }) => [s.uuid, s.title]),
  );

  // План доставки: [кому, telegramId, текст]
  const plan: Array<{ to: string; tgId: number; text: MdText }> = [];
  let skipped = 0;

  for (const c of campaigns) {
    if (c.context !== 'stream_fate') continue;
    const streamTitle = titles.get(c.scopeId) ?? '—';
    const outcome = c.payload.subjectOutcome;

    // Субъекту — всегда
    const subject = profiles.get(c.subjectId);
    if (subject?.telegramId !== undefined) {
      plan.push({
        to: `субъект ${subject.name}`,
        tgId: subject.telegramId,
        text: subjectText(streamTitle, outcome),
      });
    } else {
      skipped++;
      console.log(`  ⚠️ пропуск (нет telegramId): субъект ${subject?.uuid}`);
    }

    // Ментору — только завершившие «Синтаксиса - 4»
    if (c.scopeId === MENTOR_STREAM_ID && outcome.startsWith('completed')) {
      const mentor = profiles.get(c.payload.mentorId);
      if (mentor?.telegramId !== undefined) {
        plan.push({
          to: `ментор ${mentor.name} (о ${subject?.name ?? subject?.uuid})`,
          tgId: mentor.telegramId,
          text: mentorText(streamTitle, subject?.name ?? 'студент'),
        });
      } else {
        skipped++;
        console.log(`  ⚠️ пропуск (нет telegramId): ментор ${mentor?.uuid}`);
      }
    }
  }

  console.log(
    `\nПлан доставки: ${plan.length} сообщений (пропущено: ${skipped})`,
  );
  for (const [i, p] of plan.entries()) {
    const first = p.text.split('\n')[0];
    console.log(
      `${String(i + 1).padStart(2)}. → ${p.to} (tg ${p.tgId}): ${first}`,
    );
  }

  if (!doSend) {
    console.log('\nDRY-RUN: ничего не отправлено. Боевой прогон: --send');
    return;
  }

  const api = new Bot(token).api;
  let sent = 0;
  let failed = 0;
  for (const p of plan) {
    try {
      await sendWithRetry(api, p.tgId, p.text);
      sent++;
      console.log(`✓ ${p.to}`);
    } catch (err) {
      failed++;
      console.error(`✗ ${p.to}:`, String(err).slice(0, 200));
    }
    await Bun.sleep(SEND_PAUSE_MS);
  }
  console.log(`\nГотово: отправлено ${sent}, ошибок ${failed}.`);
}

await main();
