import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { md } from '@u7-scl/core/shared';
import type {
  BotSession,
  DialogResponse,
  KbButton,
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
 * Самовыход (FR-4): кнопка «🚪 Покинуть учёбу» в меню хаба → confirm-диалог →
 * UC drop-student → студент abandoned + мягкий кик из TG-группы (FR-6 —
 * событие student.abandoned слушает InactivityStory).
 *
 * О зачислении студент узнаёт из флоу-ответа view-stream (с инструкцией
 * по /start) — подписки на student.enrolled нет.
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
   * (ФР-6, временное исключение И3 до tasks-system): кнопка ведёт в
   * CourseCatalogStory (wish → UC create-module-wish). Безкнопочные
   * 7c/7d («Курс завершён», место неизвестно) доставляет механизм
   * userFacade.notify из UC complete-student.
   */
  async #handleCompletedEvent(event: StudentCompletedEvent): Promise<void> {
    const { userId, moduleId, outcome } = event.payload;

    const user = await this.appApi.execute('get-user', {
      uuid: userId,
    });
    if (!user?.telegramId) return;

    // Место модуля в программе — идёт через домен курсов (appApi-запрос)
    const place = (await this.appApi.execute('get-module-place', {
      moduleId,
    })) as ModulePlace | undefined;

    if (outcome === 'not_advanced') {
      // Повтор того же модуля (7b) — кнопочный проактив, канал invite
      await this.proactiveSender.invite(user.telegramId, {
        text: md`🔁 Модуль не пройден до конца\\.\n\nХочешь записаться на него снова\\?`,
        keyboard: this.kb([
          [buttons.wishModule(moduleId, '🔁 Пройти модуль снова')],
        ]),
      });
      return;
    }

    if (place?.nextModuleId) {
      // advanced + есть следующий модуль (7a) — кнопочный проактив, invite
      await this.proactiveSender.invite(user.telegramId, {
        text: md`🏁 Модуль завершён\\!\n\nХочешь записаться на следующий\\?`,
        keyboard: this.kb([[buttons.wishModule(place.nextModuleId)]]),
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
    const studentResult = await getStudent(this.appApi, actor);
    if (!studentResult.ok) return studentResult.value;

    const student = studentResult.value;
    const isFinished =
      student.status === 'advanced' ||
      student.status === 'not_advanced' ||
      student.status === 'abandoned';

    const rows: KbButton[][] = [];

    if (!isFinished) {
      const hasStarted = student.steps.some((s) => s.status === 'completed');
      rows.push([
        this.btn(
          hasStarted ? '▶️ Продолжить учёбу' : '▶️ Начать учёбу',
          this.cbFor('step-view', 'my-study:continue'),
        ),
      ]);
      rows.push([
        this.btn('📂 Уроки', this.cbFor('nav-tree', 'my-study:lessons')),
      ]);
    }

    rows.push([
      this.btn(
        '📊 Мой прогресс',
        this.cbFor('progress', 'progress', student.streamId),
      ),
    ]);
    rows.push([
      this.btn('🚪 Покинуть учёбу', this.cb('my-study:leave-confirm')),
    ]);
    rows.push([buttons.mainMenu()]);

    return this.screen(md`📖 *Моя учёба*\n\nВыберите действие:`, this.kb(rows));
  }

  // ── Приватные методы: самовыход из учёбы (FR-4) ──

  async #showLeaveConfirm(actor: User): Promise<DialogResponse> {
    const studentResult = await getStudent(this.appApi, actor);
    if (!studentResult.ok) return studentResult.value;

    return this.screen(
      md`🚪 *Покинуть учёбу?*\n\nПрогресс сохранится, но ментор больше не будет тебя сопровождать\\.`,
      this.kb([
        [
          this.btn('🚪 Да, покинуть', this.cb('my-study:leave')),
          this.btn('❌ Остаться', this.cb('my-study')),
        ],
      ]),
    );
  }

  async #executeLeave(actor: User): Promise<DialogResponse> {
    const studentResult = await getStudent(this.appApi, actor);
    if (!studentResult.ok) return studentResult.value;

    const student = studentResult.value;

    try {
      await this.appApi.execute(
        'drop-student',
        { streamId: student.streamId, studentId: student.uuid },
        actor,
      );
    } catch (err) {
      return this.handleError(err);
    }

    return this.screen(
      md`Ты покинул учёбу\\. Жаль, что не сложилось — возвращайся, когда будешь готов\\!`,
      this.kb([[buttons.mainMenu('⬅️ В меню')]]),
    );
  }
}
