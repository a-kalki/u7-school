import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MainMenuAction } from '@u7-scl/bot/u7-menu';
import type {
  BotResponse,
  BotUpdate,
  SessionData,
  UiEventSubscription,
} from '@u7-scl/core/ui';
import { eventSubscription } from '@u7-scl/core/ui';
import type { ModulePlace } from '@u7-scl/course/domain';
import type { StudentCompletedEvent } from '@u7-scl/stream/domain';
import { UserPolicy } from '@u7-scl/user/domain';
import { buttons } from '../../shared/buttons';
import { getStudent } from '../shared';

/**
 * Хаб «Моя учёба» — главное меню обучения, список действий студента.
 *
 * Подписка на student.enrolled удалена (трек user-notify): студент уже
 * получает флоу-ответ view-stream о зачислении с инструкцией по /start.
 * Событие student.enrolled остаётся — его слушает ER fulfill-wish.
 */
export class HubStory extends U7BotUiStory {
  readonly name = 'hub';

  // ── Подписки на доменные события ──

  override getEventSubscriptions(): UiEventSubscription[] {
    return [
      eventSubscription<StudentCompletedEvent>('student.completed', (event) =>
        this.#handleCompletedEvent(event),
      ),
    ];
  }

  /**
   * student.completed — кнопочные ветки 7a/7b (ломают флоу, кнопки
   * предыдущего экрана снимаются). Безкнопочные 7c/7d («Курс завершён»,
   * место неизвестно) доставляет механизм userFacade.notify из UC
   * complete-student — здесь они не рендерятся (трек user-notify).
   */
  async #handleCompletedEvent(event: StudentCompletedEvent): Promise<void> {
    const { userId, moduleId, outcome } = event.payload;

    const user = (await this.appApi.execute('get-user', {
      uuid: userId,
    })) as User;
    if (!user?.telegramId) return;

    // Место модуля в программе — идёт через домен курсов (appApi-запрос)
    const place = (await this.appApi.execute('get-module-place', {
      moduleId,
    })) as ModulePlace | undefined;

    if (outcome === 'not_advanced') {
      // Повтор того же модуля (7b)
      await this.proactiveSender.send(user.telegramId, {
        sendMessage: {
          text: '🔁 Модуль не пройден до конца\\.\\n\\nХочешь записаться на него снова?',
          parseMode: 'MarkdownV2',
          keyboard: {
            rows: [[buttons.wishModule(moduleId, '🔁 Пройти модуль снова')]],
            isMultiple: false,
          },
        },
      });
      return;
    }

    if (place?.nextModuleId) {
      // advanced + есть следующий модуль (7a)
      await this.proactiveSender.send(user.telegramId, {
        sendMessage: {
          text: '🏁 Модуль завершён\\!\\n\\nХочешь записаться на следующий?',
          parseMode: 'MarkdownV2',
          keyboard: {
            rows: [[buttons.wishModule(place.nextModuleId)]],
            isMultiple: false,
          },
        },
      });
    }
    // иначе — безкнопочные 7c/7d: уведомление уже отправлено UC
  }

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    if (action === 'my-study') {
      return this.#showHub(actor);
    }
    if (action === 'my-study:leave-confirm') {
      return this.#showLeaveConfirm(actor);
    }
    if (action === 'my-study:leave') {
      return this.#executeLeave(actor);
    }
    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  override async handleMessage(
    _update: BotUpdate,
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: '⚠️ Неизвестное сообщение' } };
  }

  override async handleStart(actor: User): Promise<MainMenuAction | null> {
    if (UserPolicy.isStudent(actor)) {
      return {
        kind: 'callback',
        text: '🎓 Моя учёба',
        action: this.cb('my-study'),
        priority: 20,
        description: '🎓 Моя учёба — доступ к твоим учебным материалам',
      };
    }
    return null;
  }

  // ── Приватные методы: хаб ──

  /** Показывает хаб «Моя учёба» с кнопками действий. */
  async #showHub(actor: User): Promise<BotResponse> {
    const studentResult = await getStudent(this.appApi, actor.uuid);
    if (!studentResult.ok) return studentResult.value;

    const student = studentResult.value;
    const isFinished =
      student.status === 'advanced' ||
      student.status === 'not_advanced' ||
      student.status === 'abandoned';

    const rows: Array<Array<{ text: string; code: string }>> = [];

    if (!isFinished) {
      const hasStarted = student.steps.some((s) => s.status === 'completed');
      rows.push([
        {
          text: hasStarted ? '▶️ Продолжить учёбу' : '▶️ Начать учёбу',
          code: this.cbFor('step-view', 'my-study:continue'),
        },
      ]);
      rows.push([
        { text: '📂 Уроки', code: this.cbFor('nav-tree', 'my-study:lessons') },
      ]);
    }

    rows.push([
      {
        text: '📊 Мой прогресс',
        code: this.cbFor('progress', 'progress', student.streamId),
      },
    ]);
    rows.push([
      { text: '🚪 Покинуть поток', code: this.cb('my-study:leave-confirm') },
    ]);
    rows.push([buttons.mainMenu()]);

    return {
      sendMessage: {
        text: '📖 *Моя учёба*\n\nВыберите действие:',
        parseMode: 'MarkdownV2',
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  // ── Приватные методы: выход из потока ──

  async #showLeaveConfirm(actor: User): Promise<BotResponse> {
    const studentResult = await getStudent(this.appApi, actor.uuid);
    if (!studentResult.ok) return studentResult.value;

    return {
      sendMessage: {
        text: '🚪 *Покинуть поток?*\n\nВы уверены, что хотите покинуть поток? Это действие нельзя отменить\\.',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              { text: '🚪 Да, покинуть', code: this.cb('my-study:leave') },
              { text: '❌ Отмена', code: this.cb('my-study') },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  async #executeLeave(actor: User): Promise<BotResponse> {
    const studentResult = await getStudent(this.appApi, actor.uuid);
    if (!studentResult.ok) return studentResult.value;

    const student = studentResult.value;

    try {
      await this.appApi.execute(
        'drop-student',
        { streamId: student.streamId, studentId: student.uuid },
        actor.uuid,
      );
    } catch (err) {
      return this.handleError(err);
    }

    return {
      sendMessage: {
        text: '👋 Вы покинули поток\\. Если захотите вернуться — обратитесь к ментору\\.',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [[buttons.mainMenu()]],
          isMultiple: false,
        },
      },
    };
  }
}
