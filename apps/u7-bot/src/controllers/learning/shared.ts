import type { User } from '@u7-scl/app/domain';
import type { ApiApp } from '@u7-scl/core/api';
import { type MdText, md, mdConcat, mdJoin, mdRaw } from '@u7-scl/core/shared';
import type { DialogResponse, NavNodeStatus } from '@u7-scl/core/ui';
import {
  formatBreadcrumbs,
  formatStepBody,
  STATUS_ICONS,
  screen,
} from '@u7-scl/core/ui';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import type { Student } from '@u7-scl/stream/domain';
import { StreamDs } from '@u7-scl/stream/domain';
import type { U7BotAppMeta } from '../../core/u7-bot-app-meta';

/**
 * Получает студента по userId через appApi.
 * Возвращает DialogResponse (экран) при ошибке.
 */
export async function getStudent(
  appApi: ApiApp<U7BotAppMeta>,
  actor: User,
): Promise<
  { ok: true; value: Student } | { ok: false; value: DialogResponse }
> {
  try {
    const user = await appApi.execute(
      'get-student-by-user',
      { userId: actor.uuid },
      actor,
    );
    return { ok: true, value: user as Student };
  } catch {
    return { ok: false, value: notEnrolled() };
  }
}

/** Экран «студент не записан» (общий для стори learning). */
export function notEnrolled(): DialogResponse {
  return screen(md`📖 Вы не записаны ни на один поток`);
}

/**
 * Получает студента и поток. null — студент не записан или поток недоступен.
 */
export async function getStudentAndStream(
  appApi: ApiApp<U7BotAppMeta>,
  actor: User,
): Promise<{
  student: Student | null;
  stream: { title: string; contentSnapshot: ContentSnapshot } | null;
}> {
  const studentResult = await getStudent(appApi, actor);
  if (!studentResult.ok) return { student: null, stream: null };

  const student = studentResult.value;

  try {
    const stream = await appApi.execute('get-stream', {
      streamId: student.streamId,
    });
    return {
      student,
      stream: stream as { title: string; contentSnapshot: ContentSnapshot },
    };
  } catch {
    return { student: null, stream: null };
  }
}

/** Находит lessonId для шага в снапшоте. */
export function findLessonIdForStep(
  snapshot: ContentSnapshot,
  stepId: string,
): string | null {
  for (const project of snapshot) {
    for (const lesson of project.lessons) {
      if (lesson.stepIds.includes(stepId)) {
        return lesson.lessonId;
      }
    }
  }
  return null;
}

/** Список completed шагов в порядке прохождения. */
export function getCompletedStepsInOrder(student: Student): string[] {
  return student.steps
    .filter((s) => s.status === 'completed')
    .map((s) => s.stepId);
}

/** Строит список шагов урока с маркерами для отображения в просмотре шага. */
export async function buildStepList(
  appApi: ApiApp<U7BotAppMeta>,
  snapshot: ContentSnapshot,
  lessonId: string,
  student: Student,
): Promise<MdText> {
  const stepStatuses = new Map<string, 'completed' | 'issued'>();
  for (const sr of student.steps) {
    stepStatuses.set(sr.stepId, sr.status as 'completed' | 'issued');
  }

  // Найти stepIds урока
  let stepIds: string[] = [];
  for (const project of snapshot) {
    for (const lesson of project.lessons) {
      if (lesson.lessonId === lessonId) {
        stepIds = lesson.stepIds;
        break;
      }
    }
    if (stepIds.length > 0) break;
  }

  if (stepIds.length === 0) return md``;

  const lines: MdText[] = [md`_Шаги урока:_`];

  for (const sid of stepIds) {
    const status = stepStatuses.get(sid);
    let marker: string;
    if (status === 'completed') {
      marker = '✅';
    } else if (status === 'issued') {
      marker = '▶️';
    } else {
      marker = '🔒';
    }

    let desc: string;
    try {
      const step = await appApi.execute('get-step', { uuid: sid });
      desc = (step as { description?: string }).description ?? sid;
    } catch {
      desc = sid;
    }

    lines.push(md`${marker} _${desc}_`);
  }

  return mdJoin(lines);
}

/**
 * Загружает описания шагов через get-steps-by-lessons.
 */
export async function loadStepDescriptions(
  appApi: ApiApp<U7BotAppMeta>,
  lessonIds: string[],
): Promise<Record<string, Array<{ uuid: string; description: string }>>> {
  try {
    return (await appApi.execute('get-steps-by-lessons', {
      lessonIds,
    })) as Record<string, Array<{ uuid: string; description: string }>>;
  } catch {
    return {};
  }
}

/**
 * Форматирует прогресс-бар: [██████░░░░] X/Y (10 блоков).
 * Возвращает уже размеченный MdText (mdRaw).
 */
export function formatProgressBar(current: number, total: number): MdText {
  const width = 10;
  const filled = total === 0 ? 0 : Math.round((current / total) * width);
  const empty = width - filled;
  const block = '█'.repeat(filled) + '░'.repeat(empty);
  return mdRaw(`\\[${block}\\] ${current}/${total}`);
}

export interface FormatStepMessageOpts {
  mode?: 'study' | 'student' | 'readOnly';
  breadcrumbs?: string[];
  status?: NavNodeStatus;
  statusLabel?: string;
}

/**
 * Форматирует сообщение шага: заголовок, разделитель, тело.
 * Поддерживает режимы:
 * - 'student' — карточка шага drill-down со статусом студента (S05b);
 * - 'readOnly' — карточка шага drill-down для ментора/зрителя (S03) без статуса;
 * - 'study' (дефолт) — режим прохождения с прогресс-баром (S05a).
 */
export function formatStepMessage(
  streamTitle: string,
  resolved: {
    projectIndex: number;
    lessonIndex: number;
    stepIndex: number;
    totalSteps: number;
    projectTitle: string;
    lessonTitle: string;
  } | null,
  step: {
    uuid: string;
    description: string;
    kind: string;
    code?: string;
    content?: string;
  },
  snapshot?: ContentSnapshot,
  student?: { steps: Array<{ stepId: string; status: string }> },
  opts?: FormatStepMessageOpts,
): MdText {
  const mode = opts?.mode ?? 'study';

  if (mode === 'student' || mode === 'readOnly') {
    const sections: MdText[] = [];

    // Хлебные крошки
    const defaultBreadcrumbs = [
      '📖 Программа модуля',
      resolved?.projectTitle ?? 'Проект',
      resolved?.lessonTitle ?? 'Урок',
      `Шаг ${resolved?.stepIndex ?? 1}`,
    ];
    sections.push(formatBreadcrumbs(opts?.breadcrumbs ?? defaultBreadcrumbs));

    // Статус (только для режима студента)
    if (mode === 'student') {
      const status = opts?.status ?? 'in_progress';
      const icon = STATUS_ICONS[status] ?? '▶️';
      const label =
        opts?.statusLabel ??
        (status === 'completed' ? 'Пройден' : 'В процессе');
      sections.push(md`${icon} ${label}`);
    }

    // Тело шага
    const body = formatStepBody(step);
    if (body) {
      sections.push(body);
    }

    return mdJoin(sections, '\n\n');
  }

  // Режим 'study' (активное прохождение S05a):
  // Прогресс урока: только завершённые шаги.
  // completed и total берём из одного источника: иначе прогресс-бар
  // может получить completed > total и упасть в String.repeat.
  let completed = resolved?.stepIndex ?? 0;
  let totalSteps = resolved?.totalSteps ?? 1;
  if (snapshot && student) {
    const progress = StreamDs.getStepLessonProgress(
      snapshot,
      step.uuid,
      student,
    );
    completed = progress.completed;
    totalSteps = progress.total;
  }

  const lines: MdText[] = [
    md`📖 *Поток:* ${streamTitle}`,
    md`📁 *Проект:* ${resolved?.projectTitle ?? '(неизвестный проект)'}`,
    md`📚 *Урок:* «${resolved?.lessonTitle ?? '(неизвестный урок)'}»`,
    md`🔢 p${resolved?.projectIndex ?? 0}\\-l${resolved?.lessonIndex ?? 0}`,
    md``,
    mdRaw('――――――――――――――'),
    md``,
    mdConcat(md`📊 `, formatProgressBar(completed, totalSteps)),
    md`📝 *Шаг ${resolved?.stepIndex ?? 1} из ${totalSteps}:* ${step.description}`,
  ];

  const body = formatStepBody(step);
  if (body) {
    lines.push(md``, body);
  }

  return mdJoin(lines);
}

/**
 * Строит сообщение о переходе (завершение урока/проекта).
 */
export function buildTransitionMessage(
  result: {
    level: 'lesson' | 'project';
    completedLessonId?: string;
    completedProjectId?: string;
    currentStepId?: string;
  },
  stream: { title: string; contentSnapshot: ContentSnapshot },
  student: Student,
): {
  messageText: MdText;
  buttonText: string;
} {
  if (result.level === 'lesson' && result.completedLessonId) {
    const lessonTitle =
      StreamDs.buildLessonSteps(
        stream.contentSnapshot,
        result.completedLessonId,
        student,
      )?.lessonTitle ?? '';

    // Найти проект, содержащий этот урок
    let projectIdx = 0;
    for (let pi = 0; pi < stream.contentSnapshot.length; pi++) {
      const p = stream.contentSnapshot[pi];
      if (p?.lessons.some((l) => l.lessonId === result.completedLessonId)) {
        projectIdx = pi;
        break;
      }
    }

    const moduleProgress = StreamDs.computeProgress(
      stream.contentSnapshot,
      student,
    );
    const projectItem = stream.contentSnapshot[projectIdx];
    const projectProgress = projectItem
      ? StreamDs.computeProgress([projectItem], student)
      : { completed: 0, total: 0 };

    const messageText = mdJoin([
      md`🎉 Урок «${lessonTitle}» завершён\\!`,
      md``,
      mdConcat(
        md`📊 Прогресс по модулю: `,
        formatProgressBar(moduleProgress.completed, moduleProgress.total),
      ),
      mdConcat(
        md`📊 Прогресс по проекту: `,
        formatProgressBar(projectProgress.completed, projectProgress.total),
      ),
    ]);

    return { messageText, buttonText: '▶️ Начать следующий урок' };
  }

  if (result.level === 'project' && result.completedProjectId) {
    const title =
      stream.contentSnapshot.find(
        (p) => p.projectId === result.completedProjectId,
      )?.projectTitle ?? '';

    const progress = StreamDs.computeProgress(stream.contentSnapshot, student);

    const messageText = mdJoin([
      md`🚀 Проект «${title}» завершён\\!`,
      md``,
      mdConcat(
        md`📊 Прогресс по модулю: `,
        formatProgressBar(progress.completed, progress.total),
      ),
    ]);

    return { messageText, buttonText: '▶️ Начать следующий проект' };
  }

  return { messageText: md`🎉 Отличная работа\\!`, buttonText: '▶️ Продолжить' };
}
