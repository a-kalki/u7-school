import type { User } from '@u7-scl/app/domain';
import type { ApiApp } from '@u7-scl/core/api';
import { escapeMarkdown } from '@u7-scl/core/shared';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import type { Student } from '@u7-scl/stream/domain';
import { StreamDs } from '@u7-scl/stream/domain';
import type { U7BotAppMeta } from '../../core/u7-bot-app-meta';

/**
 * Получает студента по userId через appApi.
 * Возвращает BotResponse при ошибке.
 */
export async function getStudent(
  appApi: ApiApp<U7BotAppMeta>,
  userId: string,
): Promise<{ ok: true; value: Student } | { ok: false; value: BotResponse }> {
  try {
    const user = await appApi.execute(
      'get-student-by-user',
      { userId },
      userId,
    );
    return { ok: true, value: user as Student };
  } catch {
    return {
      ok: false,
      value: {
        sendMessage: {
          text: '📖 Вы не записаны ни на один поток',
          parseMode: 'MarkdownV2',
        },
      },
    };
  }
}

/**
 * Получает студента и поток. Возвращает ошибку как BotResponse при неудаче.
 */
export async function getStudentAndStream(
  appApi: ApiApp<U7BotAppMeta>,
  actor: User,
): Promise<{
  student: Student | null;
  stream: { title: string; contentSnapshot: ContentSnapshot } | null;
}> {
  const studentResult = await getStudent(appApi, actor.uuid);
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

/**
 * Если в сессии есть lastBotMessage — редактируем его (editMessage).
 * Иначе — отправляем новое (sendMessage).
 */
export function respondInContext(
  response: BotResponse,
  session: SessionData,
): BotResponse {
  const lastMsg = session.lastBotMessage;
  if (lastMsg && response.sendMessage) {
    return {
      editMessage: {
        messageId: lastMsg.messageId,
        text: response.sendMessage.text,
        keyboard: response.sendMessage.keyboard,
        parseMode: response.sendMessage.parseMode,
      },
    };
  }
  return response;
}

/** Хелпер для editMessage или sendMessage в зависимости от сессии. */
export function editOrSend(
  response: BotResponse,
  session: SessionData,
): BotResponse {
  const lastMsg = session.lastBotMessage;
  if (lastMsg && response.sendMessage) {
    return {
      editMessage: {
        messageId: lastMsg.messageId,
        text: response.sendMessage.text,
        keyboard: response.sendMessage.keyboard,
        parseMode: response.sendMessage.parseMode,
      },
    };
  }
  return response;
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
): Promise<string> {
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

  if (stepIds.length === 0) return '';

  const esc = escapeMarkdown;
  const lines: string[] = ['_Шаги урока:_'];

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

    let desc = '';
    try {
      const step = await appApi.execute('get-step', { uuid: sid });
      desc = (step as { description?: string }).description ?? sid;
    } catch {
      desc = sid;
    }

    lines.push(`${marker} _${esc(desc)}_`);
  }

  return lines.join('\n');
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
 */
export function formatProgressBar(current: number, total: number): string {
  const width = 10;
  const filled = total === 0 ? 0 : Math.round((current / total) * width);
  const empty = width - filled;
  const block = '█'.repeat(filled) + '░'.repeat(empty);
  return `\\[${block}\\] ${current}/${total}`;
}

/**
 * Форматирует сообщение шага: заголовок, разделитель, тело.
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
): string {
  const esc = escapeMarkdown;

  // Прогресс урока: только завершённые шаги
  let completed = resolved?.stepIndex ?? 0;
  if (snapshot && student) {
    const progress = StreamDs.getStepLessonProgress(
      snapshot,
      step.uuid,
      student,
    );
    completed = progress.completed;
  }

  const totalSteps = resolved?.totalSteps ?? 1;

  const lines: string[] = [
    `📖 *Поток:* ${esc(streamTitle)}`,
    `📁 *Проект:* ${esc(resolved?.projectTitle || '(неизвестный проект)')}`,
    `📚 *Урок:* «${esc(resolved?.lessonTitle || '(неизвестный урок)')}»`,
    `🔢 p${resolved?.projectIndex ?? 0}\\-l${resolved?.lessonIndex ?? 0}`,
    '',
    '――――――――――――――',
    '',
    `📊 ${formatProgressBar(completed, totalSteps)}`,
    `📝 *Шаг ${resolved?.stepIndex ?? 1} из ${totalSteps}:* ${esc(step.description)}`,
  ];

  if (step.kind === 'code' && step.code) {
    lines.push('', '```', step.code, '```');
  } else if (step.kind === 'text' && step.content) {
    const { safeConvert } = require('@u7-scl/core/shared');
    lines.push('', safeConvert(step.content));
  }

  return lines.join('\n');
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
  messageText: string;
  buttonText: string;
} {
  const esc = escapeMarkdown;

  let messageText: string;
  let buttonText: string;
  let progressLine = '';

  if (result.level === 'lesson' && result.completedLessonId) {
    const lessonTitle =
      StreamDs.buildLessonSteps(
        stream.contentSnapshot,
        result.completedLessonId,
        student,
      )?.lessonTitle ?? '';

    messageText = `🎉 Урок «${esc(lessonTitle)}» завершён\\!`;
    buttonText = '▶️ Начать следующий урок';

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
    progressLine =
      `\n📊 Прогресс по модулю: ${formatProgressBar(moduleProgress.completed, moduleProgress.total)}` +
      `\n📊 Прогресс по проекту: ${formatProgressBar(projectProgress.completed, projectProgress.total)}`;
  } else if (result.level === 'project' && result.completedProjectId) {
    const title =
      stream.contentSnapshot.find(
        (p) => p.projectId === result.completedProjectId,
      )?.projectTitle ?? '';

    messageText = `🚀 Проект «${esc(title)}» завершён\\!`;
    buttonText = '▶️ Начать следующий проект';

    const progress = StreamDs.computeProgress(stream.contentSnapshot, student);
    progressLine = `\n📊 Прогресс по модулю: ${formatProgressBar(progress.completed, progress.total)}`;
  } else {
    messageText = '🎉 Отличная работа!';
    buttonText = '▶️ Продолжить';
  }

  return { messageText: messageText + progressLine, buttonText };
}
