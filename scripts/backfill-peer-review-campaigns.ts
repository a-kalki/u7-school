/**
 * backfill-peer-review-campaigns — одноразовый replay событий судьбы
 * студентов для потоков, закрытых ДО выката peer-review (v0.1.4).
 *
 * ## Зачем
 * Кампании отзывов создаёт ER create-student-campaign, подписанная на
 * события student.completed / student.abandoned. EventBus — in-memory,
 * без персистентности: события, опубликованные до деплоя v0.1.4,
 * обработчика не нашли и пропали. Студенты этих потоков уже в
 * терминальных статусах — повторный вызов UC (complete-student /
 * mark-abandoned) невозможен. Поэтому скрипт публикует доменные события
 * повторно (replay) в шину собранного продового стека — кампании создаёт
 * штатная ER со всей своей логикой (идемпотентность, проекция исхода,
 * фабрика, сохранение).
 *
 * ## Что пишет
 * Только новый файл data/peer-review/campaigns.json. Агрегаты stream /
 * student не изменяются. Уведомления НЕ отправляются: UiApp (Telegram)
 * в скрипте не собирается.
 *
 * ## Использование
 *   bun run scripts/backfill-peer-review-campaigns.ts --dry-run
 *   bun run scripts/backfill-peer-review-campaigns.ts
 *   bun run scripts/backfill-peer-review-campaigns.ts --stream <uuid>
 *
 * ⚠️ Перед боевым прогоном: bun run backup + pm2 stop u7-school-bot
 * (чтобы бот и скрипт не писали campaigns.json параллельно).
 */

import { mkdir } from 'node:fs/promises';
import { ApiApp } from '@u7-scl/core/api';
import {
  BaseJsonDb,
  InProcEventBus,
  InProcJobScheduler,
} from '@u7-scl/core/infra';
import type { Logger } from '@u7-scl/core/shared';
import { isoNow } from '@u7-scl/core/shared';
import { CourseApiModule } from '@u7-scl/course/api';
import type { CourseApiModuleResolver } from '@u7-scl/course/domain';
import {
  CourseInProcFacade,
  CourseJsonRepo,
  LessonJsonRepo,
  ModuleJsonRepo,
  StepJsonRepo,
} from '@u7-scl/course/infra';
import {
  PeerReviewApiModule,
  ReviewCampaignJsonRepo,
  ReviewJsonRepo,
} from '@u7-scl/peer-review';
import type {
  PeerReviewApiModuleResolver,
  ReviewCampaign,
} from '@u7-scl/peer-review/domain';
import { QuestionnaireApiModule } from '@u7-scl/questionnaire/api';
import type { QuestionnaireApiModuleResolver } from '@u7-scl/questionnaire/domain';
import {
  QuestionnaireInProcFacade,
  QuestionnaireJsonRepo,
} from '@u7-scl/questionnaire/infra';
import type { StreamApiModuleResolver } from '@u7-scl/stream';
import {
  StreamApiModule,
  StreamInProcFacade,
  StreamJsonRepo,
  StudentJsonRepo,
} from '@u7-scl/stream';
import type {
  StudentAbandonedEvent,
  StudentCompletedEvent,
} from '@u7-scl/stream/domain';
import { UserApiModule } from '@u7-scl/user/api';
import type { UserApiModuleResolver } from '@u7-scl/user/domain';
import { UserInProcFacade, UserJsonRepo } from '@u7-scl/user/infra';
import { WishApiModule } from '@u7-scl/wish/api';
import type { WishApiModuleResolver } from '@u7-scl/wish/domain';
import { WishJsonRepo } from '@u7-scl/wish/infra';

/** Целевые потоки: закрыты 2026-09-20 до выката v0.1.4 (Синтаксис-4/5/6). */
const TARGET_STREAMS = [
  'a765f732-0787-4f01-8710-7aed67b68a28', // Синтаксис - 4
  'c495ba3f-0902-4deb-965d-678eddd66e7d', // Синтаксис - 5
  '851f238f-704d-44b6-8938-479297d494fc', // Синтаксис - 6
] as const;

const CAMPAIGNS_DIR = 'data/peer-review';

/** Проекция исхода субъекта — та же, что в CreateStudentCampaignEr. */
function expectedOutcome(status: string, neverStarted: boolean): string {
  if (status === 'advanced') return 'completed_passed';
  if (status === 'not_advanced') return 'completed_not_passed';
  return neverStarted ? 'never_started' : 'dropped';
}

/** Есть ли у студента хотя бы один завершённый шаг (= «начинал»). */
function hasCompletedStep(steps: Array<{ status: string }>): boolean {
  return steps.some((s) => s.status === 'completed');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const streamFilter = args
    .map((a, i) => (a === '--stream' ? args[i + 1] : null))
    .filter((s): s is string => s !== null);
  const targetStreams =
    streamFilter.length > 0 ? streamFilter : [...TARGET_STREAMS];

  // ─── Стек как в create-api-app.ts (без Telegram-интерфейса) ──
  const db = new BaseJsonDb();
  const appResolver = {
    logger: console as unknown as Logger,
    mode: 'development' as const,
    eventBus: new InProcEventBus(),
  };

  const userRepo = new UserJsonRepo('data/users/users.json', undefined, db);
  const streamRepo = new StreamJsonRepo('data/streams/streams.json');
  const studentRepo = new StudentJsonRepo('data/streams/students.json');

  const userModule = new UserApiModule({
    userRepo,
    appResolver,
    eventBus: appResolver.eventBus,
  } as unknown as UserApiModuleResolver);
  const userFacade = new UserInProcFacade(userModule);

  const courseModule = new CourseApiModule({
    db,
    moduleRepo: new ModuleJsonRepo('data/courses/modules.json'),
    courseRepo: new CourseJsonRepo('data/courses/courses.json'),
    lessonRepo: new LessonJsonRepo('data/courses/lessons.json'),
    stepRepo: new StepJsonRepo('data/courses/steps.json'),
    userFacade,
    appResolver,
    eventBus: appResolver.eventBus,
  } as unknown as CourseApiModuleResolver);
  const courseFacade = new CourseInProcFacade(courseModule);

  const questionnaireModule = new QuestionnaireApiModule({
    questionnaireRepo: new QuestionnaireJsonRepo(
      'data/questionnaires/questionnaires.json',
      db,
    ),
    userFacade,
    db,
    appResolver,
    eventBus: appResolver.eventBus,
  } as unknown as QuestionnaireApiModuleResolver);
  const questionnaireFacade = new QuestionnaireInProcFacade(
    questionnaireModule,
  );

  const streamModule = new StreamApiModule({
    streamRepo,
    streamStudentRepo: studentRepo,
    userFacade,
    courseFacade,
    appResolver,
    eventBus: appResolver.eventBus,
  } as unknown as StreamApiModuleResolver);
  const streamFacade = new StreamInProcFacade(streamModule);

  const wishModule = new WishApiModule({
    wishRepo: new WishJsonRepo('data/wish/wishes.json'),
    courseFacade,
    streamFacade,
    questionnaireFacade,
    userFacade,
    appResolver,
    eventBus: appResolver.eventBus,
  } as unknown as WishApiModuleResolver);

  const reviewCampaignRepo = new ReviewCampaignJsonRepo(
    `${CAMPAIGNS_DIR}/campaigns.json`,
  );
  const reviewRepo = new ReviewJsonRepo(`${CAMPAIGNS_DIR}/reviews.json`);

  const peerReviewModule = new PeerReviewApiModule({
    reviewCampaignRepo,
    reviewRepo,
    streamFacade,
    appResolver,
    eventBus: appResolver.eventBus,
  } as unknown as PeerReviewApiModuleResolver);

  const app = new ApiApp([
    userModule,
    wishModule,
    streamModule,
    courseModule,
    questionnaireModule,
    peerReviewModule,
  ]);

  // init() подписывает ER create-student-campaign на события судьбы.
  // start() не вызываем — таймеры job'ов в скрипте не нужны.
  app.init(new InProcJobScheduler({ logger: console as unknown as Logger }));

  // ─── План: события по каждому студенту целевых потоков ───────
  interface PlanItem {
    streamTitle: string;
    event: StudentCompletedEvent | StudentAbandonedEvent;
    expectedOutcome: string;
    expectedParticipants: number;
  }

  const plan: PlanItem[] = [];

  for (const streamId of targetStreams) {
    const stream = await streamRepo.getByUuid(streamId);
    if (!stream) {
      console.error(`❌ Поток не найден: ${streamId}`);
      process.exit(1);
    }
    if (stream.status !== 'completed') {
      console.error(
        `❌ Поток «${stream.title}» не завершён (status=${stream.status}) — backfill применим только к закрытым потокам`,
      );
      process.exit(1);
    }

    const students = await studentRepo.getByStream(streamId);
    // Ожидаемые соученики для завершивших — как в ER: все не-abandoned,
    // кроме субъекта.
    const peerIds = students
      .filter((s) => s.status !== 'abandoned')
      .map((s) => s.userId);

    for (const st of students) {
      const neverStarted =
        st.status === 'abandoned' && !hasCompletedStep(st.steps);

      if (st.status === 'advanced' || st.status === 'not_advanced') {
        plan.push({
          streamTitle: stream.title,
          event: {
            eventId: crypto.randomUUID(),
            eventName: 'student.completed',
            occurredAt: isoNow(),
            aggregateName: 'Student',
            aggregateId: st.uuid,
            payload: {
              studentId: st.uuid,
              userId: st.userId,
              streamId,
              moduleId: stream.moduleId,
              outcome: st.status,
            },
          },
          expectedOutcome: expectedOutcome(st.status, neverStarted),
          expectedParticipants: peerIds.filter((id) => id !== st.userId).length,
        });
      } else if (st.status === 'abandoned') {
        plan.push({
          streamTitle: stream.title,
          event: {
            eventId: crypto.randomUUID(),
            eventName: 'student.abandoned',
            occurredAt: isoNow(),
            aggregateName: 'Student',
            aggregateId: st.uuid,
            payload: {
              studentId: st.uuid,
              userId: st.userId,
              streamId,
              who: st.abandonDetails?.who ?? 'mentor',
              cause: st.abandonDetails?.cause ?? 'inactivity',
            },
          },
          expectedOutcome: expectedOutcome(st.status, neverStarted),
          expectedParticipants: 0,
        });
      } else {
        console.warn(
          `⚠️ ${stream.title}: студент ${st.userId} в нетерминальном статусе ${st.status} — пропуск`,
        );
      }
    }
  }

  console.log(
    `\nПлан: ${plan.length} событий по потокам: ${targetStreams.length}`,
  );

  if (dryRun) {
    for (const item of plan) {
      const e = item.event;
      const outcome =
        e.eventName === 'student.completed'
          ? `outcome=${e.payload.outcome}`
          : `who=${e.payload.who} cause=${e.payload.cause}`;
      console.log(
        `  [${item.streamTitle}] ${e.eventName} user=${e.payload.userId} ${outcome} → ${item.expectedOutcome}, участников: ${item.expectedParticipants}`,
      );
    }
    console.log('\nDry-run: ничего не записано.');
    return;
  }

  // ─── Боевой прогон: publish + ожидание кампании в репо ───────
  await mkdir(CAMPAIGNS_DIR, { recursive: true });

  let created = 0;
  let failed = 0;

  for (const item of plan) {
    const { streamId, userId } = item.event.payload;
    appResolver.eventBus.publish(item.event);

    // InProcEventBus не ждёт async-хендлеров — поллим репо до появления
    // кампании окна (streamId, userId).
    let campaign: ReviewCampaign | undefined;
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      campaign = await reviewCampaignRepo.findBySubject(streamId, userId);
      if (campaign) break;
      await new Promise((r) => setTimeout(r, 50));
    }

    if (!campaign) {
      console.error(
        `❌ ${item.streamTitle}: кампания для user=${userId} не создалась за 5 с`,
      );
      failed++;
      continue;
    }

    // Сверка факта с ожиданиями (исход и состав участников)
    const problems: string[] = [];
    if (campaign.payload.subjectOutcome !== item.expectedOutcome) {
      problems.push(
        `исход ${campaign.payload.subjectOutcome} ≠ ожидаемый ${item.expectedOutcome}`,
      );
    }
    if (campaign.participants.length !== item.expectedParticipants) {
      problems.push(
        `участников ${campaign.participants.length} ≠ ожидаемых ${item.expectedParticipants}`,
      );
    }
    if (problems.length > 0) {
      console.error(
        `⚠️ ${item.streamTitle} user=${userId}: ${problems.join('; ')}`,
      );
      failed++;
    } else {
      created++;
    }
  }

  console.log(
    `\nГотово: создано ${created} из ${plan.length} кампаний, проблем: ${failed}`,
  );
  if (failed > 0) process.exit(1);
}

main();
