import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { md } from '@u7-scl/core/shared';
import {
  type BotSession,
  type DialogResponse,
  parseNavAddress,
  presentNavLevel,
  type StepContentData,
} from '@u7-scl/core/ui';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import {
  getStudentAndStream,
  loadStepDescriptions,
  notEnrolled,
} from '../shared';
import {
  resolveStudentNavLevel,
  type StudentNavAddress,
} from '../student-nav-resolver';

/**
 * Дерево уроков студента с drill-down карточками (S05b).
 * Уровни навигации: модуль (root) → проект → урок → шаг.
 *
 * Drill-down внутри стори — тот же dialog.path: транспорт рендерит
 * ответ edit'ом на месте («владеешь экраном — обновляй»).
 */
export class NavTreeStory extends U7BotUiStory {
  readonly name = 'nav-tree';

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    const { student, stream } = await getStudentAndStream(this.appApi, actor);
    if (!student || !stream) {
      return notEnrolled();
    }

    const navAddress = this.#parseAddress(action, stream.contentSnapshot);
    if (!navAddress) {
      return this.unknownCommand(action, actor, session);
    }

    // Собираем описания шагов и контент (если уровень step)
    const stepDescriptions: Record<string, string> = {};
    let stepContent: StepContentData | undefined;

    if (navAddress.level === 'root' || navAddress.level === 'project') {
      const lessonIds = stream.contentSnapshot.flatMap((p) =>
        p.lessons.map((l) => l.lessonId),
      );
      if (lessonIds.length > 0) {
        const byLesson = await loadStepDescriptions(this.appApi, lessonIds);
        for (const steps of Object.values(byLesson)) {
          for (const s of steps) {
            stepDescriptions[s.uuid] = s.description;
          }
        }
      }
    } else if (navAddress.level === 'lesson' && navAddress.targetId) {
      const byLesson = await loadStepDescriptions(this.appApi, [
        navAddress.targetId,
      ]);
      for (const steps of Object.values(byLesson)) {
        for (const s of steps) {
          stepDescriptions[s.uuid] = s.description;
        }
      }
    } else if (navAddress.level === 'step' && navAddress.targetId) {
      try {
        const step = (await this.appApi.execute('get-step', {
          uuid: navAddress.targetId,
        })) as {
          description?: string;
          kind?: string;
          code?: string;
          content?: string;
        };
        if (step) {
          stepDescriptions[navAddress.targetId] = step.description ?? '';
          stepContent = {
            kind: step.kind ?? 'text',
            code: step.code,
            content: step.content,
          };
        }
      } catch {
        // Если шаг не загружен — резолвер обработает отсутствие контента
      }
    }

    const navLevel = resolveStudentNavLevel({
      story: this.name,
      address: navAddress,
      snapshot: stream.contentSnapshot,
      student,
      stepDescriptions,
      stepContent,
      backToHubCode: this.cbFor('hub', 'my-study'),
    });

    if (!navLevel) {
      return this.screen(md`⚠️ Шаг или уровень не найден или недоступен`);
    }

    const presented = presentNavLevel(navLevel);
    return this.screen(presented.text, presented.keyboard);
  }

  /**
   * Разбирает callback action в адрес навигации.
   * Поддерживает как канонические nav-tree адреса, так и legacy алиасы.
   */
  #parseAddress(
    action: string,
    snapshot: ContentSnapshot,
  ): StudentNavAddress | null {
    if (
      action === 'root' ||
      action === 'my-study:lessons' ||
      action === 'nav-tree:root'
    ) {
      return { level: 'root' };
    }

    const parsed = parseNavAddress(action);
    if (parsed) {
      if (parsed.level === 'root') {
        return { level: 'root' };
      }
      if (
        (parsed.level === 'project' ||
          parsed.level === 'lesson' ||
          parsed.level === 'step') &&
        parsed.id
      ) {
        return {
          level: parsed.level as 'project' | 'lesson' | 'step',
          targetId: parsed.id,
        };
      }
    }

    // Обратная совместимость legacy префиксов
    if (action.includes('my-study:project:')) {
      const param = action.split('my-study:project:')[1] ?? '';
      const numIndex = Number.parseInt(param, 10);
      if (!Number.isNaN(numIndex) && String(numIndex) === param) {
        const project = snapshot[numIndex - 1];
        if (project) {
          return { level: 'project', targetId: project.projectId };
        }
      }
      return { level: 'project', targetId: param };
    }

    if (action.includes('my-study:lesson:')) {
      const lessonId = action.split('my-study:lesson:')[1] ?? '';
      return { level: 'lesson', targetId: lessonId };
    }

    return null;
  }
}
