/**
 * migrate-old-questionnaires — перенос старых анкет (движок onboarding,
 * `data/questionnaires/questionnaires.json`) в новую среду:
 * движок `packages/questionnaire` (`q-questionnaires.json`) + механика
 * `packages/wish` (`wishes.json`).
 *
 * Спецификация: conductor/tracks/questionnaire-migration_20260829/spec.md
 *
 * Правила:
 * - переносятся все completed анкеты (кроме тестовых Nur) и незавершённые
 *   со строго >2 ответами (по факту таких нет);
 * - мульти-ответы → join через запятую (формат нового движка, a-root.ts
 *   #submitCurrentQuestion); goal_text → answerCode 'text' + answerText;
 * - wish: один на юзера, статус fulfilled (юзер есть в students.json)
 *   или confirmed; даты — из последней completed анкеты юзера;
 * - каждая запись валидируется схемой valibot ДО записи; любая ошибка —
 *   полный abort без записи (JsonFileRepo молча теряет невалидные записи
 *   при перезаписи);
 * - первым шагом создаётся бэкап целевых файлов с таймстампом;
 * - идемпотентность: дубликаты по uuid анкеты и паре user+course
 *   пропускаются.
 *
 * Использование:
 *   bun run scripts/migrate-old-questionnaires.ts
 *   bun run scripts/migrate-old-questionnaires.ts --data-dir=/tmp/sandbox/data
 *
 * Запускать ТОЛЬКО при остановленном боте: JsonFileRepo держит данные
 * в памяти, гонка записи недопустима.
 */

import {
  type Questionnaire,
  type QuestionnairePool,
  QuestionnairePoolSchema,
  QuestionnaireSchema,
} from '@u7-scl/questionnaire/domain';
import type { Wish } from '@u7-scl/wish/domain';
import { WishSchema } from '@u7-scl/wish/domain';
import * as v from 'valibot';

// ── Константы ──────────────────────────────────────────────────

/** Курс Fullstack JS — цель всех мигрируемых желаний */
const COURSE_ID = '29adc3be-873e-47ec-aa30-61f5e6e25d4e';

/** TelegramId Нура — тестовые анкеты, не переносятся */
const NUR_TELEGRAM_ID = 773084180;

/** Статусы существующего wish, при которых новый не создаётся */
const BLOCKING_WISH_STATUSES = [
  'expressed',
  'pending',
  'confirmed',
  'fulfilled',
] as const;

const dataDirArg = process.argv
  .slice(2)
  .find((a) => a.startsWith('--data-dir='));

const DATA_DIR = dataDirArg ? dataDirArg.slice('--data-dir='.length) : 'data';

const OLD_FILE = `${DATA_DIR}/questionnaires/questionnaires.json`;
const NEW_FILE = `${DATA_DIR}/questionnaires/q-questionnaires.json`;
const USERS_FILE = `${DATA_DIR}/users/users.json`;
const WISHES_FILE = `${DATA_DIR}/wish/wishes.json`;
const STUDENTS_FILE = `${DATA_DIR}/streams/students.json`;
const POOL_FILE = 'packages/wish/src/domain/wish/pools/course.json';

// ── Типы старых данных ─────────────────────────────────────────

interface OldAnswer {
  questionCode: string;
  answerCodes: string[];
  textValue?: string;
  answeredAt: string;
}

interface OldQuestionnaire {
  uuid: string;
  telegramId: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  answers: OldAnswer[];
  currentQuestionCode: string | null;
  draftAnswers: string[] | Record<string, string>;
  createdAt: string;
  updatedAt?: string;
}

interface UserRecord {
  uuid: string;
  telegramId: number;
}

interface WishRecord {
  uuid: string;
  userId: string;
  target: { kind: string; courseId?: string; moduleId?: string };
  status: Wish['status'];
}

interface StudentRecord {
  userId: string;
}

// ── Отчёт ──────────────────────────────────────────────────────

interface Report {
  readTotal: number;
  skippedNur: number;
  skippedNoUser: number;
  skippedUnfinished: number;
  unfinishedByReason: Map<string, number>;
  migratedQuestionnaires: number;
  duplicateQuestionnaires: number;
  createdWishes: number;
  createdWishesFulfilled: number;
  createdWishesConfirmed: number;
  skippedWishes: Map<string, number>;
}

const report: Report = {
  readTotal: 0,
  skippedNur: 0,
  skippedNoUser: 0,
  skippedUnfinished: 0,
  unfinishedByReason: new Map(),
  migratedQuestionnaires: 0,
  duplicateQuestionnaires: 0,
  createdWishes: 0,
  createdWishesFulfilled: 0,
  createdWishesConfirmed: 0,
  skippedWishes: new Map(),
};

function addUnfinishedReason(reason: string) {
  report.unfinishedByReason.set(
    reason,
    (report.unfinishedByReason.get(reason) ?? 0) + 1,
  );
}

function addSkippedWish(reason: string) {
  report.skippedWishes.set(reason, (report.skippedWishes.get(reason) ?? 0) + 1);
}

// ── Аборт: без записи, с полным объяснением ────────────────────

function abort(message: string): never {
  console.error(`\n❌ ABORT: ${message}`);
  console.error('   Изменения НЕ записаны — целевые файлы не тронуты.');
  process.exit(1);
}

// ── Валидация записи с контекстом ──────────────────────────────

function parseOrFail<T>(
  schema: v.GenericSchema<T>,
  value: unknown,
  context: string,
): T {
  const result = v.safeParse(schema, value);
  if (!result.success) {
    const issues = result.issues
      .map(
        (i) =>
          `${i.path?.map((p) => String(p.key)).join('.') ?? ''}: ${i.message}`,
      )
      .join('; ');
    abort(`запись не прошла валидацию схемы — ${context}: ${issues}`);
  }
  return result.output;
}

// ── Бэкап целевых файлов (первый шаг) ──────────────────────────

async function backupTargets() {
  const ts = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  const dest = `${DATA_DIR}/backup/${ts}-questionnaire-migration`;
  const targets = [NEW_FILE, WISHES_FILE];
  for (const file of targets) {
    const src = Bun.file(file);
    if (!(await src.exists())) continue;
    const rel = file.slice(DATA_DIR.length + 1);
    await Bun.write(`${dest}/${rel}`, src);
  }
  console.log(`💾 Бэкап целевых файлов: ${dest}/`);
}

// ── Трансформация анкеты ───────────────────────────────────────

function transformQuestionnaire(
  old: OldQuestionnaire,
  respondentId: string,
  pool: QuestionnairePool,
): Questionnaire {
  // Тип каждого вопроса берём из снимка пула — источник истины нового движка
  const poolTypes = new Map(
    pool.questions.map((q) => [q.questionCode, q.type]),
  );

  const answers = old.answers.map((a) => {
    const type = poolTypes.get(a.questionCode);
    if (type === undefined) {
      abort(
        `анкета ${old.uuid}: вопрос "${a.questionCode}" отсутствует в пуле ${COURSE_ID}`,
      );
    }
    if (type === 'text') {
      if (a.textValue === undefined) {
        abort(
          `анкета ${old.uuid}: text-ответ "${a.questionCode}" без textValue — отказ молчаливо терять данные`,
        );
      }
      return {
        questionCode: a.questionCode,
        answerCode: 'text',
        answerText: a.textValue,
        answeredAt: a.answeredAt,
      };
    }
    // choice: мульти-ответы нового движка хранит как join через запятую
    const answerCode = a.answerCodes.join(',');
    if (!answerCode) {
      abort(`анкета ${old.uuid}: choice-ответ "${a.questionCode}" без кодов`);
    }
    return {
      questionCode: a.questionCode,
      answerCode,
      answeredAt: a.answeredAt,
    };
  });

  const completedAt = old.updatedAt;
  if (!completedAt) {
    abort(`анкета ${old.uuid} (completed) без updatedAt`);
  }

  return {
    kind: 'standard',
    uuid: old.uuid,
    respondentId,
    status: 'completed',
    currentQuestionCode: null,
    draftAnswers: {},
    answers,
    questionPool: pool,
    ownerInfo: { courseId: COURSE_ID },
    createdAt: old.createdAt,
    updatedAt: old.updatedAt,
    completedAt,
  };
}

// ── Основной сценарий ──────────────────────────────────────────

async function main() {
  console.log(`🚀 Миграция старых анкет (data-dir: ${DATA_DIR})\n`);

  // 1. Бэкап целевых файлов до любых изменений (FR5)
  await backupTargets();

  // 2. Чтение источников
  const [oldRecords, users, newRecords, wishes, students, pools] =
    await Promise.all([
      Bun.file(OLD_FILE).json() as Promise<OldQuestionnaire[]>,
      Bun.file(USERS_FILE).json() as Promise<UserRecord[]>,
      Bun.file(NEW_FILE).json() as Promise<Questionnaire[]>,
      Bun.file(WISHES_FILE).json() as Promise<WishRecord[]>,
      Bun.file(STUDENTS_FILE).json() as Promise<StudentRecord[]>,
      Bun.file(POOL_FILE).json() as Promise<Record<string, QuestionnairePool>>,
    ]);

  report.readTotal = oldRecords.length;

  const tgToUuid = new Map(users.map((u) => [u.telegramId, u.uuid]));
  const existingQIds = new Set(newRecords.map((q) => q.uuid));
  const studentUserIds = new Set(students.map((s) => s.userId));

  const rawPool = pools[COURSE_ID];
  if (!rawPool) {
    abort(`пул курса ${COURSE_ID} не найден в ${POOL_FILE}`);
  }
  // Снимок пула валидируем сразу — он уйдёт в каждую анкету (FR4)
  const pool = parseOrFail(
    QuestionnairePoolSchema,
    rawPool,
    `пул курса ${COURSE_ID} из ${POOL_FILE}`,
  );

  // 3. Фильтрация и трансформация анкет (FR1–FR2)
  const migrated: Questionnaire[] = [];
  const userQuestionnaires = new Map<string, OldQuestionnaire[]>();

  for (const old of oldRecords) {
    if (old.telegramId === NUR_TELEGRAM_ID) {
      report.skippedNur++;
      continue;
    }

    const respondentId = tgToUuid.get(old.telegramId);
    if (!respondentId) {
      report.skippedNoUser++;
      console.warn(
        `⚠️  Анкета ${old.uuid}: telegramId ${old.telegramId} не найден в users.json — пропуск.`,
      );
      continue;
    }

    const isCompleted = old.status === 'completed';
    if (!isCompleted && old.answers.length <= 2) {
      report.skippedUnfinished++;
      addUnfinishedReason(`${old.status}, ответов: ${old.answers.length}`);
      continue;
    }

    if (isCompleted) {
      const list = userQuestionnaires.get(respondentId) ?? [];
      list.push(old);
      userQuestionnaires.set(respondentId, list);
    }

    if (existingQIds.has(old.uuid)) {
      report.duplicateQuestionnaires++;
      continue;
    }

    const questionnaire = transformQuestionnaire(old, respondentId, pool);
    // FR4: валидация до записи, ошибка — полный abort
    parseOrFail(
      QuestionnaireSchema,
      questionnaire,
      `анкета ${old.uuid} (tg ${old.telegramId})`,
    );
    migrated.push(questionnaire);
    report.migratedQuestionnaires++;
  }

  // 4. Wish: один на юзера завершивших анкету (FR3, FR6)
  const createdWishes: Wish[] = [];
  for (const [userId, olds] of userQuestionnaires) {
    const existing = wishes.find(
      (w) =>
        w.target.kind === 'course' &&
        w.target.courseId === COURSE_ID &&
        w.userId === userId,
    );
    if (
      existing &&
      (BLOCKING_WISH_STATUSES as readonly string[]).includes(existing.status)
    ) {
      addSkippedWish(`существующий wish (${existing.status})`);
      continue;
    }

    const lastCompleted = olds.reduce((a, b) =>
      (b.updatedAt ?? b.createdAt) > (a.updatedAt ?? a.createdAt) ? b : a,
    );
    const datedAt = lastCompleted.updatedAt ?? lastCompleted.createdAt;
    const status: Wish['status'] = studentUserIds.has(userId)
      ? 'fulfilled'
      : 'confirmed';

    const wish: Wish = {
      uuid: crypto.randomUUID(),
      userId,
      target: { kind: 'course', courseId: COURSE_ID },
      status,
      createdAt: datedAt,
      updatedAt: datedAt,
    };
    parseOrFail(WishSchema, wish, `wish юзера ${userId}`);
    createdWishes.push(wish);
    report.createdWishes++;
    if (status === 'fulfilled') report.createdWishesFulfilled++;
    else report.createdWishesConfirmed++;
  }

  // 5. Отчёт (FR7)
  console.log('\n📋 Отчёт миграции:');
  console.log(`   Прочитано старых анкет: ${report.readTotal}`);
  console.log(`   Пропущено (тестовые Nur): ${report.skippedNur}`);
  if (report.skippedNoUser > 0) {
    console.log(
      `   Пропущено (нет юзера в users.json): ${report.skippedNoUser}`,
    );
  }
  console.log(
    `   Пропущено (незавершённые с ≤2 ответов): ${report.skippedUnfinished}`,
  );
  for (const [reason, count] of report.unfinishedByReason) {
    console.log(`     - ${reason}: ${count}`);
  }
  console.log(`   Перенесено анкет: ${report.migratedQuestionnaires}`);
  console.log(
    `   Дубликаты анкет (uuid уже в новом файле): ${report.duplicateQuestionnaires}`,
  );
  console.log(
    `   Создано wish: ${report.createdWishes} (fulfilled: ${report.createdWishesFulfilled}, confirmed: ${report.createdWishesConfirmed})`,
  );
  for (const [reason, count] of report.skippedWishes) {
    console.log(`   Пропущено wish — ${reason}: ${count}`);
  }

  // 6. Запись (идемпотентность: при 0 изменений файлы не трогаем)
  if (migrated.length === 0 && createdWishes.length === 0) {
    console.log('\n✅ Изменений нет (идемпотентный повторный запуск).');
    return;
  }

  if (migrated.length > 0) {
    await Bun.write(
      NEW_FILE,
      JSON.stringify([...newRecords, ...migrated], null, 2),
    );
    console.log(
      `\n💾 ${NEW_FILE}: +${migrated.length} анкет (всего ${newRecords.length + migrated.length})`,
    );
  }
  if (createdWishes.length > 0) {
    await Bun.write(
      WISHES_FILE,
      JSON.stringify([...wishes, ...createdWishes], null, 2),
    );
    console.log(
      `💾 ${WISHES_FILE}: +${createdWishes.length} wish (всего ${wishes.length + createdWishes.length})`,
    );
  }

  console.log('\n✅ Миграция завершена.');
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
