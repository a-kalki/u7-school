import type { BotResponse, BotUpdate, MainMenuAction, SessionData } from '@u7-scl/core/ui';
import { BotUserStory } from '@u7-scl/core/ui';
import type { StreamAppMeta } from '../../../domain/module';

/** Упрощённый интерфейс актора для проверки ролей */
interface Actor {
  uuid: string;
  roles: string[];
}

interface StudentInfo {
  uuid: string;
  streamId: string;
  userId: string;
  status: string;
  currentStepId: string;
}

interface StreamInfo {
  uuid: string;
  title: string;
  contentSnapshot: Array<{
    projectTitle: string;
    lessons: Array<{ lessonTitle: string; stepIds: string[] }>;
  }>;
}

interface CompleteStepResult {
  level: 'step' | 'lesson' | 'project' | 'stream';
  currentStepId?: string;
  completedLessonId?: string;
  completedProjectId?: string;
  completed?: boolean;
}

/**
 * US-4: Прохождение обучения (активная фаза).
 * Показывает текущий шаг, обрабатывает завершение шага.
 */
export class LearningStory extends BotUserStory<StreamAppMeta> {
  readonly name = 'learning';

  async handleCallback(
    action: string,
    actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    const a = actor as Actor;

    // Завершение шага: complete:<studentId>:<streamId>:<stepId>
    if (action.startsWith('complete:')) {
      return this.#handleComplete(action, a);
    }

    // Показ текущего шага
    if (action === 'my-study') {
      return this.#handleMyStudy(a);
    }

    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  override async handleMessage(
    _update: BotUpdate,
    _actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  override async handleStart(actor: unknown): Promise<MainMenuAction | null> {
    const a = actor as Actor;
    if (a.roles.includes('STUDENT')) {
      return {
        text: '📖 Моя учёба',
        action: this.cb('my-study'),
        priority: 20,
      };
    }
    return null;
  }

  // ── Приватные методы ──

  async #handleMyStudy(a: Actor): Promise<BotResponse> {
    const student = (await this.api.execute('get-student-by-user', {
      userId: a.uuid,
    })) as unknown as StudentInfo | undefined;

    if (!student) {
      return {
        sendMessage: {
          text: '📖 Вы не записаны ни на один поток',
          parseMode: 'MarkdownV2',
        },
      };
    }

    if (student.status === 'completed') {
      return {
        sendMessage: {
          text: '🎉 *Поздравляем!* Вы завершили обучение в потоке!',
          parseMode: 'MarkdownV2',
        },
      };
    }

    const stream = (await this.api.execute('get-stream', {
      streamId: student.streamId,
    })) as unknown as StreamInfo;

    const stepLabel = this.#findStepLabel(
      stream.contentSnapshot,
      student.currentStepId,
    );

    return {
      sendMessage: {
        text: [
          `📖 *Моя учёба* — _${this.escapeMarkdown(stream.title)}_`,
          '',
          `📌 Текущее задание: ${stepLabel}`,
        ].join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              {
                text: '✅ Выполнено',
                code: this.cb(
                  `complete:${student.uuid}:${student.streamId}:${student.currentStepId}`,
                ),
              },
            ],
            [
              {
                text: '📊 Мой прогресс',
                code: `progress:progress:${student.streamId}`,
              },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  async #handleComplete(
    action: string,
    _a: Actor,
  ): Promise<BotResponse> {
    const parts = action.split(':');
    // Формат: complete:<studentId>:<streamId>:<stepId>
    const studentId = parts[1]!;
    const streamId = parts[2]!;
    const stepId = parts[3]!;

    const result = (await this.api.execute('complete-step', {
      studentId,
      streamId,
      stepId,
    })) as unknown as CompleteStepResult;

    const levelMessages: Record<string, string> = {
      step: '✅ Шаг выполнен! Следующее задание уже ждёт.',
      lesson: '🎉 Урок завершён! Отличная работа!',
      project: '🚀 Проект завершён! Ты на шаг ближе к финишу!',
      stream:
        '🏆 *Поток полностью завершён!* Поздравляем с успешным окончанием обучения!',
    };

    return {
      sendMessage: {
        text: levelMessages[result.level] ?? '✅ Задание выполнено!',
        parseMode: 'MarkdownV2',
      },
    };
  }

  #findStepLabel(
    snapshot: Array<{
      projectTitle: string;
      lessons: Array<{ lessonTitle: string; stepIds: string[] }>;
    }>,
    stepId: string,
  ): string {
    for (const project of snapshot) {
      for (const lesson of project.lessons) {
        const idx = lesson.stepIds.indexOf(stepId);
        if (idx !== -1) {
          return `Шаг ${idx + 1} / ${this.escapeMarkdown(lesson.lessonTitle)}`;
        }
      }
    }
    return `Шаг (${this.escapeMarkdown(stepId.slice(0, 8))}...)`;
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }
}
