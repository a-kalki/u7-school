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
    const children: NavChild[] = snapshot.map((p, pIdx) => {
      const subChildren: NavSubChild[] = p.lessons.map((l) => ({
        id: l.lessonId,
        title: l.lessonTitle,
      }));

      return {
        id: p.projectId,
        index: pIdx + 1,
        title: p.projectTitle,
        emoji: '📁',
        enterable: true,
        address: formatNavAddress(story, 'project', p.projectId),
        children: subChildren,
      };
    });

    const backAddress =
      rootBackAddress ?? `${story.split(':prog:')[0]}:view:${stream.uuid}`;

    return {
      breadcrumbs: ['📖 Программа модуля'],
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

    const children: NavChild[] = snapProject.lessons.map((l, lIdx) => {
      const subChildren: NavSubChild[] = l.stepIds.map((sId, sIdx) => ({
        id: sId,
        title: stepDescriptions?.[sId] ?? `Шаг ${sIdx + 1}`,
      }));

      return {
        id: l.lessonId,
        index: lIdx + 1,
        title: l.lessonTitle,
        emoji: '📝',
        enterable: true,
        address: formatNavAddress(story, 'lesson', l.lessonId),
        children: subChildren,
      };
    });

    const prevSnapProject = snapshot[projectIndex - 1];
    const nextSnapProject = snapshot[projectIndex + 1];

    return {
      breadcrumbs: ['📖 Программа модуля', snapProject.projectTitle],
      title: snapProject.projectTitle,
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

    const children: NavChild[] = snapLesson.stepIds.map((sId, sIdx) => ({
      id: sId,
      index: sIdx + 1,
      title: stepDescriptions?.[sId] ?? `Шаг ${sIdx + 1}`,
      emoji: '📄',
      enterable: isMentor,
      address: isMentor ? formatNavAddress(story, 'step', sId) : undefined,
    }));

    const prevLesson = foundProject.lessons[lessonIndex - 1];
    const nextLesson = foundProject.lessons[lessonIndex + 1];

    return {
      breadcrumbs: [
        '📖 Программа модуля',
        foundProject.projectTitle,
        snapLesson.lessonTitle,
      ],
      title: snapLesson.lessonTitle,
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

    return {
      breadcrumbs: [
        '📖 Программа модуля',
        foundProject.projectTitle,
        foundLesson.lessonTitle,
        `Шаг ${stepIndex + 1}`,
      ],
      title: stepDescriptions?.[stepId] ?? `Шаг ${stepIndex + 1}`,
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
