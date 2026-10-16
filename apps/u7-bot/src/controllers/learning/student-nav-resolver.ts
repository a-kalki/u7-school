import {
  formatNavAddress,
  formatStepBody,
  type NavChild,
  type NavLevel,
  type NavNodeStatus,
  type StepContentData,
} from '@u7-scl/core/ui';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import type { Student } from '@u7-scl/stream/domain';
import { StreamDs } from '@u7-scl/stream/domain';

export interface StudentNavAddress {
  level: 'root' | 'project' | 'lesson' | 'step';
  targetId?: string;
}

export interface ResolveStudentNavLevelParams {
  story?: string;
  address: StudentNavAddress;
  snapshot: ContentSnapshot;
  student: Student;
  stepDescriptions?: Record<string, string>;
  stepContent?: StepContentData;
  backToHubCode?: string;
}

function mapStatus(status: 'completed' | 'current' | 'locked'): NavNodeStatus {
  if (status === 'completed') return 'completed';
  if (status === 'current') return 'in_progress';
  return 'locked';
}

/**
 * Резолвит карточку уровня NavLevel для студента на основе ContentSnapshot и Student progress.
 * Чистая функция без побочных эффектов.
 */
export function resolveStudentNavLevel(
  params: ResolveStudentNavLevelParams,
): NavLevel | null {
  const story = params.story ?? 'nav-tree';
  const tree = StreamDs.buildNavigationTree(params.snapshot, params.student);
  const { address, snapshot, stepDescriptions, stepContent, backToHubCode } =
    params;

  // ── Уровень 1: Root (Модуль / Проекты) ──
  if (address.level === 'root') {
    const subtitle = 'Проекты модуля:';

    const children: NavChild[] = tree.projects.map((p, pIdx) => {
      const snapProject = snapshot[pIdx];
      const projectId = snapProject?.projectId ?? `project-${pIdx}`;

      return {
        id: projectId,
        index: pIdx + 1,
        title: p.title,
        status: mapStatus(p.status),
        meta: `(${p.completedLessons}/${p.totalLessons})`,
        enterable: true,
        address: formatNavAddress(story, 'project', projectId),
      };
    });

    return {
      multilineBreadcrumbs: true,
      breadcrumbs: ['📖 Программа модуля'],
      subtitle,
      children,
      back: {
        address: backToHubCode ?? 'hub:my-study',
        label: '⬅️ Назад к учёбе',
      },
    };
  }

  // ── Уровень 2: Project (Проект / Уроки) ──
  if (address.level === 'project') {
    let projectIndex = snapshot.findIndex(
      (p) => p.projectId === address.targetId,
    );
    if (projectIndex === -1 && address.targetId) {
      const num = Number.parseInt(address.targetId, 10);
      if (!Number.isNaN(num) && snapshot[num - 1]) {
        projectIndex = num - 1;
      }
    }
    if (projectIndex === -1) return null;
    const project = tree.projects[projectIndex];
    const snapProject = snapshot[projectIndex];
    if (!project || !snapProject) return null;

    const subtitle = 'Уроки проекта:';

    const children: NavChild[] = project.lessons.map((l, lIdx) => {
      return {
        id: l.lessonId,
        index: lIdx + 1,
        title: l.title,
        status: mapStatus(l.status),
        meta: `(${l.completedSteps}/${l.totalSteps})`,
        enterable: true,
        address: formatNavAddress(story, 'lesson', l.lessonId),
      };
    });

    const prevSnapProject = snapshot[projectIndex - 1];
    const nextSnapProject = snapshot[projectIndex + 1];
    const totalProjects = snapshot.length;

    return {
      multilineBreadcrumbs: true,
      breadcrumbs: [
        '📖 Программа модуля',
        `Проект ${projectIndex + 1}/${totalProjects}: ${project.title}`,
      ],
      title: project.title,
      subtitle,
      children,
      prev: prevSnapProject
        ? {
            address: formatNavAddress(
              story,
              'project',
              prevSnapProject.projectId,
            ),
          }
        : undefined,
      next: nextSnapProject
        ? {
            address: formatNavAddress(
              story,
              'project',
              nextSnapProject.projectId,
            ),
          }
        : undefined,
      back: {
        address: formatNavAddress(story, 'root'),
        label: '⬅️ Назад к проектам',
      },
    };
  }

  // ── Уровень 3: Lesson (Урок / Шаги) ──
  if (address.level === 'lesson') {
    let parentProject: (typeof tree.projects)[0] | undefined;
    let parentSnapProject: (typeof snapshot)[0] | undefined;
    let lessonIndex = -1;

    for (let pIdx = 0; pIdx < tree.projects.length; pIdx++) {
      const p = tree.projects[pIdx];
      if (!p) continue;
      const idx = p.lessons.findIndex((l) => l.lessonId === address.targetId);
      if (idx !== -1) {
        parentProject = p;
        parentSnapProject = snapshot[pIdx];
        lessonIndex = idx;
        break;
      }
    }

    if (!parentProject || !parentSnapProject || lessonIndex === -1) return null;
    const lesson = parentProject.lessons[lessonIndex];
    if (!lesson) return null;

    const subtitle = 'Шаги урока:';

    const children: NavChild[] = lesson.steps.map((s) => {
      const isAvailable = s.status === 'completed' || s.status === 'current';
      const title = stepDescriptions?.[s.stepId] ?? `Шаг ${s.index}`;
      return {
        id: s.stepId,
        index: s.index,
        title,
        status: mapStatus(s.status),
        enterable: isAvailable,
        address: isAvailable
          ? formatNavAddress(story, 'step', s.stepId)
          : undefined,
      };
    });

    const prevLesson = parentProject.lessons[lessonIndex - 1];
    const nextLesson = parentProject.lessons[lessonIndex + 1];
    const totalProjects = tree.projects.length;
    const parentProjectIndex = tree.projects.indexOf(parentProject);
    const totalLessons = parentProject.lessons.length;

    return {
      multilineBreadcrumbs: true,
      breadcrumbs: [
        '📖 Программа модуля',
        `Проект ${parentProjectIndex + 1}/${totalProjects}: ${parentProject.title}`,
        `Урок ${lessonIndex + 1}/${totalLessons}: ${lesson.title}`,
      ],
      title: lesson.title,
      subtitle,
      children,
      prev: prevLesson
        ? { address: formatNavAddress(story, 'lesson', prevLesson.lessonId) }
        : undefined,
      next: nextLesson
        ? { address: formatNavAddress(story, 'lesson', nextLesson.lessonId) }
        : undefined,
      back: {
        address: formatNavAddress(
          story,
          'project',
          parentSnapProject.projectId,
        ),
        label: '⬅️ Назад к урокам',
      },
    };
  }

  // ── Уровень 4: Step (Шаг карточка) ──
  if (address.level === 'step') {
    let parentProject: (typeof tree.projects)[0] | undefined;
    let parentLesson: (typeof tree.projects)[0]['lessons'][0] | undefined;
    let stepIndex = -1;

    for (const p of tree.projects) {
      for (const l of p.lessons) {
        const idx = l.steps.findIndex((s) => s.stepId === address.targetId);
        if (idx !== -1) {
          parentProject = p;
          parentLesson = l;
          stepIndex = idx;
          break;
        }
      }
      if (parentLesson) break;
    }

    if (!parentProject || !parentLesson || stepIndex === -1) return null;
    const step = parentLesson.steps[stepIndex];
    if (!step) return null;

    // Заблокированный шаг недоступен для просмотра
    if (step.status === 'locked') return null;

    const status = mapStatus(step.status);
    const statusLabel = status === 'completed' ? 'Пройден' : 'В процессе';

    // Листание: только доступные шаги в пределах текущего урока
    const prevStep = parentLesson.steps[stepIndex - 1];
    const rawNextStep = parentLesson.steps[stepIndex + 1];
    const nextStep =
      rawNextStep && rawNextStep.status !== 'locked' ? rawNextStep : undefined;
    const totalSteps = parentLesson.steps.length;

    const rawStepTitle = stepDescriptions?.[step.stepId] ?? `Шаг ${step.index}`;
    const cleanStepTitle = rawStepTitle.replace(
      /^(?:Шаг(?:\s*\d+)?:\s*)+/iu,
      '',
    );
    const stepLabel = `Шаг ${stepIndex + 1}/${totalSteps}: ${cleanStepTitle}`;

    let body: string | undefined = stepContent
      ? formatStepBody(stepContent)
      : undefined;
    if (body && body.length > 3200) {
      body = `${body.slice(0, 3100)}\n\n⚠️ _[Контент сокращён: полный текст доступен на платформе]_`;
    }

    const totalProjects = tree.projects.length;
    const parentProjectIndex = tree.projects.indexOf(parentProject);
    const totalLessons = parentProject.lessons.length;
    const parentLessonIndex = parentProject.lessons.indexOf(parentLesson);

    return {
      multilineBreadcrumbs: true,
      breadcrumbs: [
        '📖 Программа модуля',
        `Проект ${parentProjectIndex + 1}/${totalProjects}: ${parentProject.title}`,
        `Урок ${parentLessonIndex + 1}/${totalLessons}: ${parentLesson.title}`,
        stepLabel,
      ],
      status,
      statusLabel,
      body,
      prev: prevStep
        ? { address: formatNavAddress(story, 'step', prevStep.stepId) }
        : undefined,
      next: nextStep
        ? { address: formatNavAddress(story, 'step', nextStep.stepId) }
        : undefined,
      back: {
        address: formatNavAddress(story, 'lesson', parentLesson.lessonId),
        label: '⬅️ Назад к уроку',
      },
    };
  }

  return null;
}
