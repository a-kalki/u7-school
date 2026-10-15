import {
  formatNavAddress,
  formatStepBody,
  type NavChild,
  type NavLevel,
  type NavSubChild,
  parseNavAddress,
  type StepContentData,
} from '@u7-scl/core/ui';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import type { Stream } from '@u7-scl/stream/domain';

export type StreamNavMode = 'mentor' | 'viewer';

export interface StreamNavAddress {
  level: 'root' | 'project' | 'lesson' | 'step';
  targetId?: string;
}

export interface ResolveStreamNavLevelParams {
  stream: Stream;
  address: string | StreamNavAddress;
  story?: string;
  mode?: StreamNavMode;
  stepDescriptions?: Record<string, string>;
  stepBodies?: Record<string, string>;
  stepContent?: StepContentData;
  rootBackAddress?: string;
}

/**
 * Склонение существительных после числительных в русском языке.
 */
function plural(n: number, one: string, two: string, five: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return five;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return two;
  return five;
}

/**
 * Резолвит карточку уровня NavLevel для потока (ментор или зритель) на основе ContentSnapshot.
 * Без статусов студента и прогресса.
 * Чистая функция без побочных эффектов.
 */
export function resolveStreamNavLevel(
  params: ResolveStreamNavLevelParams,
): NavLevel | null {
  const {
    stream,
    story = `view-stream-mentor:prog:${stream.uuid}`,
    mode = 'mentor',
    stepDescriptions,
    stepBodies,
    stepContent,
    rootBackAddress,
  } = params;

  let parsedAddress: StreamNavAddress;
  if (typeof params.address === 'string') {
    const parsed = parseNavAddress(params.address);
    if (!parsed) return null;
    parsedAddress = {
      level: parsed.level as StreamNavAddress['level'],
      targetId: parsed.id,
    };
  } else {
    parsedAddress = params.address;
  }

  const snapshot: ContentSnapshot = stream.contentSnapshot;
  const isMentor = mode === 'mentor';

  // ── Уровень 1: Root (Модуль / Проекты) ──
  if (parsedAddress.level === 'root') {
    const projectCount = snapshot.length;
    const subtitle = `Модуль состоит из ${projectCount} проект${plural(projectCount, 'а', 'ов', 'ов')}`;

    const children: NavChild[] = snapshot.map((p, pIdx) => {
      const subChildren: NavSubChild[] = p.lessons.map((l) => ({
        id: l.lessonId,
        title: `Урок: ${l.lessonTitle}`,
        emoji: '📝',
      }));

      return {
        id: p.projectId,
        index: pIdx + 1,
        title: `Проект: ${p.projectTitle}`,
        emoji: '📁',
        enterable: true,
        address: formatNavAddress(story, 'project', p.projectId),
        children: subChildren,
      };
    });

    const backAddress =
      rootBackAddress ?? `${story.split(':prog:')[0]}:view:${stream.uuid}`;

    return {
      multilineBreadcrumbs: true,
      breadcrumbs: ['📖 Программа модуля'],
      subtitle,
      children,
      back: {
        label: '⬅️ Назад к потоку',
        address: backAddress,
      },
    };
  }

  // ── Уровень 2: Project (Проект / Уроки) ──
  if (parsedAddress.level === 'project') {
    let projectIndex = snapshot.findIndex(
      (p) => p.projectId === parsedAddress.targetId,
    );
    if (projectIndex === -1 && parsedAddress.targetId) {
      const num = Number.parseInt(parsedAddress.targetId, 10);
      if (!Number.isNaN(num) && snapshot[num - 1]) {
        projectIndex = num - 1;
      }
    }
    if (projectIndex === -1) return null;
    const snapProject = snapshot[projectIndex];
    if (!snapProject) return null;

    const lessonCount = snapProject.lessons.length;
    const subtitle = `Проект состоит из ${lessonCount} урок${plural(lessonCount, 'а', 'ов', 'ов')}`;

    const children: NavChild[] = snapProject.lessons.map((l, lIdx) => {
      const subChildren: NavSubChild[] = l.stepIds.map((sId, sIdx) => {
        const title = stepDescriptions?.[sId] ?? `Шаг ${sIdx + 1}`;
        return {
          id: sId,
          title: title.startsWith('Шаг') ? title : `Шаг: ${title}`,
          emoji: '📄',
        };
      });

      return {
        id: l.lessonId,
        index: lIdx + 1,
        title: `Урок: ${l.lessonTitle}`,
        emoji: '📝',
        enterable: true,
        address: formatNavAddress(story, 'lesson', l.lessonId),
        children: subChildren,
      };
    });

    const prevSnapProject = snapshot[projectIndex - 1];
    const nextSnapProject = snapshot[projectIndex + 1];

    return {
      multilineBreadcrumbs: true,
      breadcrumbs: [
        '📖 Программа модуля',
        `Проект: ${snapProject.projectTitle}`,
      ],
      title: snapProject.projectTitle,
      subtitle,
      children,
      prev: prevSnapProject
        ? {
            label: '◀️ Пред. проект',
            address: formatNavAddress(
              story,
              'project',
              prevSnapProject.projectId,
            ),
          }
        : undefined,
      next: nextSnapProject
        ? {
            label: 'След. проект ▶️',
            address: formatNavAddress(
              story,
              'project',
              nextSnapProject.projectId,
            ),
          }
        : undefined,
      back: {
        label: '⬅️ Назад к модулю',
        address: formatNavAddress(story, 'root'),
      },
    };
  }

  // ── Уровень 3: Lesson (Урок / Шаги) ──
  if (parsedAddress.level === 'lesson') {
    let foundProject: (typeof snapshot)[number] | undefined;
    let lessonIndex = -1;

    for (const p of snapshot) {
      const idx = p.lessons.findIndex(
        (l) => l.lessonId === parsedAddress.targetId,
      );
      if (idx !== -1) {
        foundProject = p;
        lessonIndex = idx;
        break;
      }
    }

    if (!foundProject || lessonIndex === -1) return null;
    const snapLesson = foundProject.lessons[lessonIndex];
    if (!snapLesson) return null;

    const stepCount = snapLesson.stepIds.length;
    const subtitle = `Урок состоит из ${stepCount} шаг${plural(stepCount, 'а', 'ов', 'ов')}`;

    const children: NavChild[] = snapLesson.stepIds.map((sId, sIdx) => {
      const title = stepDescriptions?.[sId] ?? `Шаг ${sIdx + 1}`;
      return {
        id: sId,
        index: sIdx + 1,
        title: title.startsWith('Шаг') ? title : `Шаг: ${title}`,
        emoji: '📄',
        enterable: isMentor,
        address: isMentor ? formatNavAddress(story, 'step', sId) : undefined,
      };
    });

    const prevLesson = foundProject.lessons[lessonIndex - 1];
    const nextLesson = foundProject.lessons[lessonIndex + 1];

    return {
      multilineBreadcrumbs: true,
      breadcrumbs: [
        '📖 Программа модуля',
        `Проект: ${foundProject.projectTitle}`,
        `Урок: ${snapLesson.lessonTitle}`,
      ],
      title: snapLesson.lessonTitle,
      subtitle,
      children,
      prev: prevLesson
        ? {
            label: '◀️ Пред. урок',
            address: formatNavAddress(story, 'lesson', prevLesson.lessonId),
          }
        : undefined,
      next: nextLesson
        ? {
            label: 'След. урок ▶️',
            address: formatNavAddress(story, 'lesson', nextLesson.lessonId),
          }
        : undefined,
      back: {
        label: '⬅️ Назад к проекту',
        address: formatNavAddress(story, 'project', foundProject.projectId),
      },
    };
  }

  // ── Уровень 4: Step (Карточка шага) ──
  if (parsedAddress.level === 'step') {
    if (!isMentor) return null;

    let foundProject: (typeof snapshot)[number] | undefined;
    let foundLesson: (typeof snapshot)[number]['lessons'][number] | undefined;
    let stepIndex = -1;

    for (const p of snapshot) {
      for (const l of p.lessons) {
        const idx = l.stepIds.indexOf(parsedAddress.targetId ?? '');
        if (idx !== -1) {
          foundProject = p;
          foundLesson = l;
          stepIndex = idx;
          break;
        }
      }
      if (foundLesson) break;
    }

    if (!foundProject || !foundLesson || stepIndex === -1) return null;

    const stepId = foundLesson.stepIds[stepIndex]!;
    const body: string | undefined =
      stepBodies?.[stepId] ??
      (stepContent ? formatStepBody(stepContent) : undefined);

    const prevStepId = foundLesson.stepIds[stepIndex - 1];
    const nextStepId = foundLesson.stepIds[stepIndex + 1];

    const rawStepTitle = stepDescriptions?.[stepId] ?? `Шаг ${stepIndex + 1}`;
    const stepLabel = rawStepTitle.startsWith('Шаг')
      ? rawStepTitle
      : `Шаг: ${rawStepTitle}`;

    return {
      multilineBreadcrumbs: true,
      breadcrumbs: [
        '📖 Программа модуля',
        `Проект: ${foundProject.projectTitle}`,
        `Урок: ${foundLesson.lessonTitle}`,
        stepLabel,
      ],
      title: rawStepTitle,
      body,
      prev: prevStepId
        ? {
            label: '◀️ Пред. шаг',
            address: formatNavAddress(story, 'step', prevStepId),
          }
        : undefined,
      next: nextStepId
        ? {
            label: 'След. шаг ▶️',
            address: formatNavAddress(story, 'step', nextStepId),
          }
        : undefined,
      back: {
        label: '⬅️ Назад к уроку',
        address: formatNavAddress(story, 'lesson', foundLesson.lessonId),
      },
    };
  }

  return null;
}
