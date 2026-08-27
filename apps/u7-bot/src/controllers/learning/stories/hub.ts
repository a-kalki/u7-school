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
import type { StudentEnrolledEvent } from '@u7-scl/stream/domain';
import { UserPolicy } from '@u7-scl/user/domain';
import { buttons } from '../../shared/buttons';
import { getStudent } from '../shared';

/**
 * Хаб «Моя учёба» — главное меню обучения, список действий студента.
 */
export class HubStory extends U7BotUiStory {
  readonly name = 'hub';

  // ── Подписки на доменные события ──

  override getEventSubscriptions(): UiEventSubscription[] {
    return [
      eventSubscription<StudentEnrolledEvent>('student.enrolled', (event) =>
        this.#handleEnrolledEvent(event),
      ),
    ];
  }

  /** student.enrolled — уведомление «Ты зачислен» с кнопкой «Моя учёба» */
  async #handleEnrolledEvent(event: StudentEnrolledEvent): Promise<void> {
    const { userId, streamId } = event.payload;

    // telegramId резолвится в стори — payload доменных событий без каналальных данных
    const user = (await this.appApi.execute('get-user', {
      uuid: userId,
    })) as User;
    if (!user?.telegramId) return;

    // Название потока — необязательно: сбой загрузки не мешает уведомлению
    let streamTitle: string | undefined;
    try {
      const stream = (await this.appApi.execute('get-stream', {
        streamId,
      })) as { title?: string };
      streamTitle = stream?.title;
    } catch {
      streamTitle = undefined;
    }

    const where = streamTitle
      ? ` в поток «${this.escapeMarkdown(streamTitle)}»`
      : '';

    await this.proactiveSender.notify(user.telegramId, {
      text: `🎓 Ты зачислен${where}!\n\nНачинай учёбу — кнопка ниже.`,
      parseMode: 'MarkdownV2',
      keyboard: {
        rows: [[{ text: '🎓 Моя учёба', code: this.cb('my-study') }]],
        isMultiple: false,
      },
    });
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
