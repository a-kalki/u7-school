import {
  formatNavAddress,
  formatStepBody,
  type NavChild,
  type NavLevel,
  type NavNodeStatus,
  type NavSubChild,
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
    const children: NavChild[] = tree.projects.map((p, pIdx) => {
      const snapProject = snapshot[pIdx];
      const projectId = snapProject?.projectId ?? `project-${pIdx}`;

      const subChildren: NavSubChild[] = p.lessons.map((l) => ({
        id: l.lessonId,
        title: l.title,
        status: mapStatus(l.status),
        meta: `(${l.completedSteps}/${l.totalSteps})`,
      }));

      return {
        id: projectId,
        index: pIdx + 1,
        title: p.title,
        status: mapStatus(p.status),
        meta: `(${p.completedLessons}/${p.totalLessons})`,
        enterable: true,
        children: subChildren,
      };
    });

    return {
      breadcrumbs: ['📂 Уроки'],
      children,
      back: {
        address: backToHubCode ?? 'hub:my-study',
        label: '⬅️ Назад к учёбе',
      },
    };
  }

  // ── Уровень 2: Project (Проект / Уроки) ──
  if (address.level === 'project') {
    const projectIndex = snapshot.findIndex(
      (p) => p.projectId === address.targetId,
    );
    if (projectIndex === -1) return null;
    const project = tree.projects[projectIndex];
    const snapProject = snapshot[projectIndex];
    if (!project || !snapProject) return null;

    const children: NavChild[] = project.lessons.map((l, lIdx) => {
      const subChildren: NavSubChild[] = l.steps.map((s) => ({
        id: s.stepId,
        title: stepDescriptions?.[s.stepId] ?? `Шаг ${s.index}`,
        status: mapStatus(s.status),
      }));

      return {
        id: l.lessonId,
        index: lIdx + 1,
        title: l.title,
        status: mapStatus(l.status),
        meta: `(${l.completedSteps}/${l.totalSteps})`,
        enterable: true,
        children: subChildren,
      };
    });

    const prevSnapProject = snapshot[projectIndex - 1];
    const nextSnapProject = snapshot[projectIndex + 1];

    return {
      breadcrumbs: ['📂 Уроки', project.title],
      title: project.title,
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

    const children: NavChild[] = lesson.steps.map((s) => {
      const isAvailable = s.status === 'completed' || s.status === 'current';
      return {
        id: s.stepId,
        index: s.index,
        title: stepDescriptions?.[s.stepId] ?? `Шаг ${s.index}`,
        status: mapStatus(s.status),
        enterable: isAvailable,
      };
    });

    const prevLesson = parentProject.lessons[lessonIndex - 1];
    const nextLesson = parentProject.lessons[lessonIndex + 1];

    return {
      breadcrumbs: ['📂 Уроки', parentProject.title, lesson.title],
      title: lesson.title,
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

    return {
      breadcrumbs: [
        '📂 Уроки',
        parentProject.title,
        parentLesson.title,
        `Шаг ${step.index}`,
      ],
      status,
      statusLabel,
      body: stepContent ? formatStepBody(stepContent) : undefined,
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
