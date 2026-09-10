import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { md } from '@u7-scl/core/shared';
import type {
  BotSession,
  DialogResponse,
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
 * Самовыход (FR-4, восстановлен треком bot-ui-dialog-learning после
 * [7034c7e]): кнопка «🚪 Покинуть учёбу» в меню хаба → confirm-диалог →
 * UC drop-student → студент abandoned + мягкий кик из TG-группы (FR-6 —
 * событие student.abandoned слушает InactivityStory).
 *
 * Подписка на student.enrolled удалена (трек user-notify): студент уже
 * получает флоу-ответ view-stream о зачислении с инструкцией по /start.
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
   * student.completed — кнопочные ветки 7a/7b через канал invite
   * (ФР-6, временное исключение И3 до tasks-system): прежний UX
   * сохранён — кнопка ведёт в CourseCatalogStory (wish → UC
   * create-module-wish). Безкнопочные 7c/7d («Курс завершён», место
   * неизвестно) доставляет механизм userFacade.notify из UC
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
      // Повтор того же модуля (7b) — кнопочный проактив, канал invite
      await this.proactiveSender.invite(user.telegramId, {
        text: md`🔁 Модуль не пройден до конца\\.\n\nХочешь записаться на него снова\\?`,
        keyboard: {
          rows: [[buttons.wishModule(moduleId, '🔁 Пройти модуль снова')]],
          isMultiple: false,
        },
      });
      return;
    }

    if (place?.nextModuleId) {
      // advanced + есть следующий модуль (7a) — кнопочный проактив, invite
      await this.proactiveSender.invite(user.telegramId, {
        text: md`🏁 Модуль завершён\\!\n\nХочешь записаться на следующий\\?`,
        keyboard: {
          rows: [[buttons.wishModule(place.nextModuleId)]],
          isMultiple: false,
        },
      });
    }
    // иначе — безкнопочные 7c/7d: уведомление уже отправлено UC
  }

  // ── Callback ──

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    if (action === 'my-study') {
      return this.#showHub(actor);
    }
    if (action === 'my-study:leave-confirm') {
      return this.#showLeaveConfirm(actor);
    }
    if (action === 'my-study:leave') {
      return this.#executeLeave(actor);
    }
    return this.unknownCommand(action, actor, session);
  }

  // ── Главное меню (декларативные кнопки) ──

  override menuButtons(actor: User): MenuButton[] {
    if (UserPolicy.isStudent(actor)) {
      return [
        {
          kind: 'callback',
          text: '🎓 Моя учёба',
          action: this.cb('my-study'),
          priority: 20,
          description: '🎓 Моя учёба — доступ к твоим учебным материалам',
        },
      ];
    }
    return [];
  }

  // ── Приватные методы: хаб ──

  /** Экран хаба «Моя учёба» с кнопками действий. */
  async #showHub(actor: User): Promise<DialogResponse> {
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
      { text: '🚪 Покинуть учёбу', code: this.cb('my-study:leave-confirm') },
    ]);
    rows.push([buttons.mainMenu()]);

    return {
      screen: {
        text: md`📖 *Моя учёба*\n\nВыберите действие:`,
        keyboard: { rows, isMultiple: false },
      },
    };
  }

  // ── Приватные методы: самовыход из учёбы (FR-4) ──

  async #showLeaveConfirm(actor: User): Promise<DialogResponse> {
    const studentResult = await getStudent(this.appApi, actor.uuid);
    if (!studentResult.ok) return studentResult.value;

    return {
      screen: {
        text: md`🚪 *Покинуть учёбу?*\n\nПрогресс сохранится, но ментор больше не будет тебя сопровождать\\.`,
        keyboard: {
          rows: [
            [
              { text: '🚪 Да, покинуть', code: this.cb('my-study:leave') },
              { text: '❌ Остаться', code: this.cb('my-study') },
            ],
          ],
          isMultiple: false,
        },
      },
    };
  }

  async #executeLeave(actor: User): Promise<DialogResponse> {
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
      screen: {
        text: md`Ты покинул учёбу\\. Жаль, что не сложилось — возвращайся, когда будешь готов\\!`,
        keyboard: {
          rows: [[{ text: '⬅️ В меню', code: buttons.mainMenu().code }]],
          isMultiple: false,
        },
      },
    };
  }
}
