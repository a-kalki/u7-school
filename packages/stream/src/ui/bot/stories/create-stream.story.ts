import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import { Status } from '@u7-scl/course/domain';
import { UserPolicy } from '@u7-scl/user/domain';
import type { StreamApiModuleMeta } from '../../../domain/module';

/** Контекст wizard-а создания потока */
interface CreateStreamWizardContext {
  step: number;
  moduleId: string;
  title: string;
  description: string;
  startDate: string;
  telegramGroupId: string;
}

const WIZARD_PATH = 'create-stream/wizard';

/**
 * US-6: Пошаговый wizard создания потока.
 * Шаг 0: выбор модуля (реальный список через appApi)
 * Шаг 1: название потока (текст)
 * Шаг 2: описание (текст)
 * Шаг 3: дата старта (текст, YYYY-MM-DD)
 * Шаг 4: ссылка на Telegram-группу (текст)
 * Шаг 5: превью и подтверждение
 */
export class CreateStreamStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'create-stream';

  async handleCallback(
    action: string,
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    // Старт wizard-а
    if (action === 'start') {
      return this.#startWizard();
    }

    // Клик по кнопке выбора модуля: module:<moduleId>
    if (action.startsWith('module:')) {
      return this.#onModuleSelected(action, session);
    }

    // Подтверждение создания на шаге превью
    if (action === 'confirm') {
      return this.#handleConfirm(actor, session);
    }

    // Пропуск необязательного поля (группа)
    if (action === 'skip-group') {
      return this.#handleSkipGroup(session);
    }

    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  async handleMessage(
    update: BotUpdate,
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    if (update.type !== 'message') {
      return { sendMessage: { text: '⚠️ Ожидалось текстовое сообщение' } };
    }

    const context = session.activeHandler?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!context) {
      return { sendMessage: { text: '⚠️ Контекст wizard-а потерян' } };
    }

    switch (context.step) {
      case 0:
        return this.#handleModuleMessage(context);
      case 1:
        return this.#handleTitleInput(context, update.text);
      case 2:
        return this.#handleDescriptionInput(context, update.text);
      case 3:
        return this.#handleDateInput(context, update.text);
      case 4:
        return this.#handleGroupInput(context, update.text, actor);
      case 5:
        return {
          sendMessage: {
            text: '👆 Используйте кнопки выше для подтверждения или изменения.',
          },
        };
      default:
        return { sendMessage: { text: '⚠️ Неизвестный шаг wizard-а' } };
    }
  }

  override async handleCancel(
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return {
      releaseInput: true,
      sendMessage: { text: '🚫 Создание потока отменено' },
    };
  }

  override async handleTimeout(
    _actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    return {
      releaseInput: true,
      sendMessage: { text: '⏰ Время создания потока истекло' },
    };
  }

  override async handleStart(actor: User): Promise<MainMenuAction | null> {
    if (UserPolicy.isMentor(actor) || UserPolicy.isAdmin(actor)) {
      return {
        text: '🛠️ Создать поток',
        action: this.cb('start'),
        priority: 30,
      };
    }
    return null;
  }

  // ── Приватные шаги wizard-а ──

  async #startWizard(): Promise<BotResponse> {
    // Сразу загружаем список модулей и показываем клавиатуру выбора,
    // без лишнего промежуточного шага с ожиданием текстового ввода.
    return this.#handleModuleMessage({
      step: 0,
      moduleId: '',
      title: '',
      description: '',
      startDate: '',
      telegramGroupId: '',
    });
  }

  async #handleModuleMessage(
    ctx: CreateStreamWizardContext,
  ): Promise<BotResponse> {
    // Загружаем все опубликованные модули через appApi (модуль course)
    const modules = await this.appApi.execute('list-modules', {
      status: Status.PUBLISHED,
    });

    if (!modules || modules.length === 0) {
      return {
        sendMessage: {
          text: '📦 *Нет доступных модулей*\n\nУ вас нет опубликованных модулей. Создайте модуль в конструкторе курсов.',
          parseMode: 'MarkdownV2',
          keyboard: {
            rows: [[{ text: '🔄 Обновить список', code: this.cb('start') }]],
            isMultiple: false,
          },
        },
        captureInput: {
          path: WIZARD_PATH,
          context: ctx,
        },
      };
    }

    const rows = modules.map((m: { uuid: string; title: string }) => [
      {
        text: m.title,
        code: `create-stream:module:${m.uuid}`,
      },
    ]);

    return {
      sendMessage: {
        text: '📦 *Выберите модуль курса:*',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows,
          isMultiple: false,
        },
      },
      captureInput: {
        path: WIZARD_PATH,
        context: ctx,
      },
    };
  }

  async #onModuleSelected(
    action: string,
    session: SessionData,
  ): Promise<BotResponse> {
    const moduleId = action.split(':')[1];
    if (!moduleId) {
      return this.sendUnknownError();
    }
    const ctx: CreateStreamWizardContext = {
      ...((session.activeHandler?.context as CreateStreamWizardContext) ?? {
        step: 0,
        moduleId: '',
        title: '',
        description: '',
        startDate: '',
        telegramGroupId: '',
      }),
      step: 1,
      moduleId,
    };

    return {
      sendMessage: { text: '📝 Введите название потока:' },
      captureInput: {
        path: WIZARD_PATH,
        context: ctx,
      },
    };
  }

  #handleTitleInput(ctx: CreateStreamWizardContext, text: string): BotResponse {
    return {
      sendMessage: { text: '📄 Введите описание потока:' },
      captureInput: {
        path: WIZARD_PATH,
        context: { ...ctx, step: 2, title: text },
      },
    };
  }

  #handleDescriptionInput(
    ctx: CreateStreamWizardContext,
    text: string,
  ): BotResponse {
    return {
      sendMessage: {
        text: '📅 Введите дату старта в формате `YYYY\\-MM\\-DD` или дату время `YYYY\\-MM\\-DDTHH:MM`',
        parseMode: 'MarkdownV2',
      },
      captureInput: {
        path: WIZARD_PATH,
        context: { ...ctx, step: 3, description: text },
      },
    };
  }

  #handleDateInput(ctx: CreateStreamWizardContext, text: string): BotResponse {
    // Если дата без времени — автоматически добавляем T00:00
    const normalizedDate = text.includes('T') ? text : `${text}T00:00`;
    return {
      sendMessage: {
        text: '🔗 Введите ссылку на Telegram\\-группу потока \\(необязательно\\):',
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [[{ text: '⏭️ Пропустить', code: this.cb('skip-group') }]],
          isMultiple: false,
        },
      },
      captureInput: {
        path: WIZARD_PATH,
        context: { ...ctx, step: 4, startDate: normalizedDate },
      },
    };
  }

  async #handleGroupInput(
    ctx: CreateStreamWizardContext,
    text: string,
    _actor: User,
  ): Promise<BotResponse> {
    const fullCtx: CreateStreamWizardContext = {
      ...ctx,
      step: 5,
      telegramGroupId: text,
    };

    return this.#showPreview(fullCtx);
  }

  #handleSkipGroup(session: SessionData): BotResponse {
    const ctx = session.activeHandler?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!ctx) {
      return { sendMessage: { text: '⚠️ Контекст wizard-а потерян' } };
    }
    const fullCtx: CreateStreamWizardContext = {
      ...ctx,
      step: 5,
      telegramGroupId: '',
    };
    return this.#showPreview(fullCtx);
  }

  // ── Шаг превью ──

  #showPreview(ctx: CreateStreamWizardContext): BotResponse {
    const lines = [
      '📋 *Превью потока*',
      '',
      `*Название:* ${this.escapeMarkdown(ctx.title)}`,
      `*Описание:* ${this.escapeMarkdown(ctx.description)}`,
      `*Дата старта:* ${this.escapeMarkdown(ctx.startDate)}`,
      `*Группа:* ${this.escapeMarkdown(ctx.telegramGroupId)}`,
      '',
      'Всё верно?',
    ];

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              { text: '✅ Создать', code: this.cb('confirm') },
              { text: '⬅️ Изменить', code: this.cb('start') },
            ],
          ],
          isMultiple: false,
        },
      },
      captureInput: {
        path: WIZARD_PATH,
        context: ctx,
      },
    };
  }

  async #handleConfirm(
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    const context = session.activeHandler?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!context) {
      return {
        sendMessage: {
          text: '⚠️ Контекст wizard-а потерян. Начните заново.',
        },
      };
    }

    await this.moduleApi.execute(
      'create-stream',
      {
        title: context.title,
        description: context.description,
        moduleId: context.moduleId,
        startDate: context.startDate,
        telegramGroupId: context.telegramGroupId,
        mentorId: actor.uuid,
      },
      actor.uuid,
    );

    return {
      releaseInput: true,
      sendMessage: {
        text: '✅ *Поток успешно создан\\!*',
        parseMode: 'MarkdownV2',
      },
    };
  }
}
