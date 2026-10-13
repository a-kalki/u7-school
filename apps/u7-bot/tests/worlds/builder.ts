import type {
  Course,
  Lesson,
  Module,
  Project,
  Step,
} from '@u7-scl/course/domain';
import { Status } from '@u7-scl/course/domain';
import type {
  Review,
  ReviewCampaign,
  StudentOutcome,
} from '@u7-scl/peer-review/domain';
import type { Stream, StreamStatus, Student } from '@u7-scl/stream/domain';
import type { Role, User } from '@u7-scl/user/domain';
import { assertWorldInvariants } from './invariants';
import { isoMinute, resolveRelativeTime } from './relative-time';
import type {
  CampaignDef,
  PersonDef,
  ReviewDef,
  StreamDef,
  StudentDef,
  WorldDefinition,
  WorldState,
} from './types';
import { deterministicUuid } from './uuid';

/**
 * Проверяет согласованность судьбы кампании и статуса студента.
 */
function assertCampaignStudentFateInvariant(
  campaign: ReviewCampaign,
  student: Student | undefined,
): void {
  if (!student) {
    throw new Error(
      `Инвариант нарушен: субъект кампании ${campaign.subjectId} не найден среди студентов потока ${campaign.scopeId}`,
    );
  }

  const outcome = campaign.payload.subjectOutcome;
  const status = student.status;

  const validCombinations: Record<StudentOutcome, string[]> = {
    completed_passed: ['advanced'],
    completed_not_passed: ['not_advanced'],
    dropped: ['abandoned'],
    never_started: ['enrolled'],
  };

  const allowedStatuses = validCombinations[outcome];
  if (!allowedStatuses?.includes(status)) {
    throw new Error(
      `Инвариант нарушен: судьба кампании "${outcome}" противоречит статусу студента "${status}" (ожидалось: ${allowedStatuses?.join(', ')})`,
    );
  }
}

/**
 * Собирает типизированный WorldState из декларативного описания мира.
 */
export function buildWorldState(
  def: WorldDefinition,
  options?: { skipAssert?: boolean },
): WorldState {
  const anchorDate = def.anchorDate ?? new Date();

  // Реестры сопоставления key -> UUID
  const userUuidByKey = new Map<string, string>();
  const courseUuidByKey = new Map<string, string>();
  const moduleUuidByKey = new Map<string, string>();
  const projectUuidByKey = new Map<string, string>();
  const lessonUuidByKey = new Map<string, string>();
  const stepUuidByKey = new Map<string, string>();
  const streamUuidByKey = new Map<string, string>();
  const campaignUuidByKey = new Map<string, string>();

  // 1. Сборка пользователей (PersonDef -> User)
  const users: User[] = (def.persons ?? []).map((p: PersonDef) => {
    const uuid = p.uuid ?? deterministicUuid(`person:${p.key}`);
    userUuidByKey.set(p.key, uuid);

    const createdAt = resolveRelativeTime(
      p.registeredAt ?? 'T-90d',
      anchorDate,
    );

    const user: User = {
      uuid,
      name: p.name,
      telegramId: p.telegramId,
      roles: p.roles as Role[],
      createdAt,
    };

    if (p.nick) {
      user.nick = p.nick;
    }

    return user;
  });

  // 2. Сборка курсов, модулей, уроков, шагов
  const courses: Course[] = [];
  const modules: Module[] = [];
  const lessons: Lesson[] = [];
  const steps: Step[] = [];

  for (const c of def.courses ?? []) {
    const courseUuid = c.uuid ?? deterministicUuid(`course:${c.key}`);
    courseUuidByKey.set(c.key, courseUuid);

    const authorUuid =
      userUuidByKey.get(c.authorKey) ??
      deterministicUuid(`person:${c.authorKey}`);

    const moduleIds: string[] = [];

    for (const m of c.modules ?? []) {
      const moduleUuid = m.uuid ?? deterministicUuid(`module:${m.key}`);
      moduleUuidByKey.set(m.key, moduleUuid);
      moduleIds.push(moduleUuid);

      const moduleProjects: Project[] = [];

      for (const prj of m.projects ?? []) {
        const prjUuid = prj.uuid ?? deterministicUuid(`project:${prj.key}`);
        projectUuidByKey.set(prj.key, prjUuid);

        const lessonIds: string[] = [];

        for (const lsn of prj.lessons ?? []) {
          const lsnUuid = lsn.uuid ?? deterministicUuid(`lesson:${lsn.key}`);
          lessonUuidByKey.set(lsn.key, lsnUuid);
          lessonIds.push(lsnUuid);

          const stepIds: string[] = [];

          for (const st of lsn.steps ?? []) {
            const stUuid = st.uuid ?? deterministicUuid(`step:${st.key}`);
            stepUuidByKey.set(st.key, stUuid);
            stepIds.push(stUuid);

            const stepEntity: Step = {
              uuid: stUuid,
              moduleId: moduleUuid,
              description: st.description ?? st.title ?? 'Описание шага',
              content: st.content ?? `Содержание шага: ${st.title ?? st.key}`,
              status: Status.PUBLISHED,
              kind: 'text',
              createdAt: resolveRelativeTime('T-120d', anchorDate),
            };
            steps.push(stepEntity);
          }

          const lessonEntity: Lesson = {
            uuid: lsnUuid,
            moduleId: moduleUuid,
            title: lsn.title,
            status: Status.PUBLISHED,
            stepIds,
            mentorStepIds: [],
            createdAt: resolveRelativeTime('T-120d', anchorDate),
          };
          lessons.push(lessonEntity);
        }

        moduleProjects.push({
          uuid: prjUuid,
          title: prj.title,
          status: Status.PUBLISHED,
          lessonIds,
        });
      }

      const moduleEntity: Module = {
        uuid: moduleUuid,
        title: m.title,
        description: m.description ?? `Описание модуля ${m.title}`,
        authorId: authorUuid,
        status: Status.PUBLISHED,
        projects: moduleProjects,
        createdAt: resolveRelativeTime('T-120d', anchorDate),
      };
      modules.push(moduleEntity);
    }

    const courseEntity: Course = {
      uuid: courseUuid,
      title: c.title,
      description: c.description,
      authorId: authorUuid,
      phases: [
        {
          title: 'Основная программа',
          moduleIds,
        },
      ],
      status: Status.PUBLISHED,
      createdAt: resolveRelativeTime('T-120d', anchorDate),
    };
    courses.push(courseEntity);
  }

  // 3. Сборка потоков (StreamDef -> Stream)
  const streams: Stream[] = (def.streams ?? []).map((s: StreamDef) => {
    const streamUuid = s.uuid ?? deterministicUuid(`stream:${s.key}`);
    streamUuidByKey.set(s.key, streamUuid);

    const mentorId =
      userUuidByKey.get(s.mentorKey) ??
      deterministicUuid(`person:${s.mentorKey}`);

    const cDef = def.courses?.find((c) => c.key === s.courseKey);
    const mDef = s.moduleKey
      ? cDef?.modules?.find((m) => m.key === s.moduleKey)
      : cDef?.modules?.[0];

    const moduleId =
      (s.moduleKey ? moduleUuidByKey.get(s.moduleKey) : undefined) ??
      (mDef ? moduleUuidByKey.get(mDef.key) : undefined) ??
      deterministicUuid(`module:default`);

    // Формируем contentSnapshot
    const contentSnapshot = (mDef?.projects ?? []).map((prj) => {
      const prjUuid =
        projectUuidByKey.get(prj.key) ??
        deterministicUuid(`project:${prj.key}`);
      return {
        projectId: prjUuid,
        projectTitle: prj.title,
        lessons: (prj.lessons ?? []).map((lsn) => {
          const lsnUuid =
            lessonUuidByKey.get(lsn.key) ??
            deterministicUuid(`lesson:${lsn.key}`);
          return {
            lessonId: lsnUuid,
            lessonTitle: lsn.title,
            stepIds: (lsn.steps ?? []).map(
              (st) =>
                stepUuidByKey.get(st.key) ??
                deterministicUuid(`step:${st.key}`),
            ),
          };
        }),
      };
    });

    const startDate = resolveRelativeTime(s.startedAt ?? 'T-30d', anchorDate);
    const createdAt = new Date(
      new Date(startDate).getTime() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const streamEntity: Stream = {
      uuid: streamUuid,
      title: s.title,
      description: s.description,
      mentorId,
      moduleId,
      startDate,
      status: s.status as StreamStatus,
      telegramGroupId: s.telegramGroupId ?? '-1001111111111',
      telegramGroupInvite:
        s.telegramGroupInvite ?? 'https://t.me/+test_group_invite',
      goal: s.goal ?? 'Освоить ключевые навыки программирования',
      result: s.result ?? 'Готовый проект в портфолио',
      contentSnapshot,
      createdAt,
    };

    return streamEntity;
  });

  // 4. Сборка студентов (StudentDef -> Student)
  const students: Student[] = (def.students ?? []).map((st: StudentDef) => {
    const studentUuid = st.uuid ?? deterministicUuid(`student:${st.key}`);
    const userId =
      userUuidByKey.get(st.personKey) ??
      deterministicUuid(`person:${st.personKey}`);
    const streamId =
      streamUuidByKey.get(st.streamKey) ??
      deterministicUuid(`stream:${st.streamKey}`);

    const enrolledAt = resolveRelativeTime(st.enrolledAt, anchorDate);

    // Текущий шаг
    const defaultStepId =
      steps[0]?.uuid ?? deterministicUuid('step:placeholder');
    const currentStepId =
      (st.currentStepKey ? stepUuidByKey.get(st.currentStepKey) : undefined) ??
      st.currentStepId ??
      defaultStepId;

    const studentSteps = (st.steps ?? []).map((sRec) => {
      const stepId =
        (sRec.stepKey ? stepUuidByKey.get(sRec.stepKey) : undefined) ??
        sRec.stepId ??
        defaultStepId;

      return {
        stepId,
        status: sRec.status,
        issuedAt: resolveRelativeTime(sRec.issuedAt ?? enrolledAt, anchorDate),
        completedAt: sRec.completedAt
          ? resolveRelativeTime(sRec.completedAt, anchorDate)
          : undefined,
      };
    });

    const studentEntity: Student = {
      uuid: studentUuid,
      streamId,
      userId,
      enrolledAt,
      status: st.status,
      currentStepId,
      steps: studentSteps,
      createdAt: enrolledAt,
    };

    return studentEntity;
  });

  // 5. Сборка кампаний peer-review (CampaignDef -> ReviewCampaign)
  const campaigns: ReviewCampaign[] = (def.campaigns ?? []).map(
    (c: CampaignDef) => {
      const campaignUuid = c.uuid ?? deterministicUuid(`campaign:${c.key}`);
      campaignUuidByKey.set(c.key, campaignUuid);

      const scopeId =
        streamUuidByKey.get(c.streamKey) ??
        deterministicUuid(`stream:${c.streamKey}`);
      const subjectId =
        userUuidByKey.get(c.subjectPersonKey) ??
        deterministicUuid(`person:${c.subjectPersonKey}`);
      const mentorId =
        userUuidByKey.get(c.mentorPersonKey) ??
        deterministicUuid(`person:${c.mentorPersonKey}`);

      const createdAt = isoMinute(resolveRelativeTime(c.createdAt, anchorDate));
      const expiresAt = isoMinute(resolveRelativeTime(c.expiresAt, anchorDate));

      const participants = (c.participants ?? []).map(
        (pKey) =>
          userUuidByKey.get(pKey) ?? deterministicUuid(`person:${pKey}`),
      );

      const campaignEntity: ReviewCampaign = {
        uuid: campaignUuid,
        context: 'stream_fate',
        scopeId,
        subjectId,
        createdAt,
        expiresAt,
        participants,
        payload: {
          subjectOutcome: c.subjectOutcome,
          mentorId,
        },
      };

      // Проверка инварианта судьба кампании == исход студента
      if (!options?.skipAssert) {
        const st = students.find(
          (s) => s.streamId === scopeId && s.userId === subjectId,
        );
        assertCampaignStudentFateInvariant(campaignEntity, st);
      }

      return campaignEntity;
    },
  );

  // 6. Сборка отзывов (ReviewDef -> Review)
  const reviews: Review[] = (def.reviews ?? []).map((r: ReviewDef) => {
    const reviewUuid = r.uuid ?? deterministicUuid(`review:${r.key}`);
    const campaignUuid =
      campaignUuidByKey.get(r.campaignKey) ??
      deterministicUuid(`campaign:${r.campaignKey}`);

    const cmp = campaigns.find((c) => c.uuid === campaignUuid);
    const scopeId = cmp?.scopeId ?? deterministicUuid('stream:default');

    const authorId =
      userUuidByKey.get(r.authorPersonKey) ??
      deterministicUuid(`person:${r.authorPersonKey}`);
    const recipientId =
      userUuidByKey.get(r.recipientPersonKey) ??
      deterministicUuid(`person:${r.recipientPersonKey}`);

    const createdAt = isoMinute(
      resolveRelativeTime(r.createdAt ?? 'T-1d', anchorDate),
    );

    const reviewEntity: Review = {
      uuid: reviewUuid,
      scopeId,
      campaignId: campaignUuid,
      authorId,
      direction: r.direction,
      recipientId,
      text: r.text,
      createdAt,
    };

    if (r.authorOutcome) {
      reviewEntity.authorOutcome = r.authorOutcome;
    }

    return reviewEntity;
  });

  const state: WorldState = {
    users,
    streams,
    students,
    courses,
    modules,
    lessons,
    steps,
    campaigns,
    reviews,
    wishes: def.wishes ?? [],
    questionnaires: def.questionnaires ?? [],
    sessions: [],
    shortIds: [],
  };

  // Валидация всех инвариантов мира
  if (!options?.skipAssert) {
    assertWorldInvariants(state);
  }

  return state;
}
