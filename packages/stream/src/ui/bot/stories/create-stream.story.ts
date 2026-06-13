import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '@u7-scl/core/ui';
import { BotUserStory } from '@u7-scl/core/ui';
import type { StreamAppMeta } from '../../../domain/module';

/** Упрощённый интерфейс актора */
interface Actor {
  uuid: string;
  roles: string[];
}

/** Контекст wizard-а создания потока */
interface CreateStreamWizardContext {
  step: number;
  moduleId: string;
  title: string;
  description: string;
  startDate: string;
  telegramGroupId: string;
}

interface ModuleItem {
  uuid: string;
  title: string;
}

const WIZARD_PATH = 'create-stream/wizard';

/**
 * US-6: Пошаговый wizard создания потока.
 * Шаг 0: выбор модуля
 * Шаг 1: название потока (текст)
 * Шаг 2: описание (текст)
 * Шаг 3: дата старта (текст, YYYY-MM-DD)
 * Шаг 4: ссылка на Telegram-группу (текст)
 * Шаг 5: финальное создание
 */
export class CreateStreamStory extends BotUserStory<StreamAppMeta> {
  readonly name = 'create-stream';

  async handleCallback(
    action: string,
    actor: unknown,
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

    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  async handleMessage(
    update: BotUpdate,
    actor: unknown,
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
        return this.#handleModuleMessage(context, update.text);
      case 1:
        return this.#handleTitleInput(context, update.text);
      case 2:
        return this.#handleDescriptionInput(context, update.text);
      case 3:
        return this.#handleDateInput(context, update.text);
      case 4:
        return this.#handleGroupInput(context, update.text, actor);
      default:
        return { sendMessage: { text: '⚠️ Неизвестный шаг wizard-а' } };
    }
  }

  override async handleCancel(
    _actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    return {
      releaseInput: true,
      sendMessage: { text: '🚫 Создание потока отменено' },
    };
  }

  override async handleTimeout(
    _actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    return {
      releaseInput: true,
      sendMessage: { text: '⏰ Время создания потока истекло' },
    };
  }

  override async handleStart(actor: unknown): Promise<MainMenuAction | null> {
    const a = actor as Actor;
    if (a.roles.includes('MENTOR') || a.roles.includes('ADMIN')) {
      return {
        text: '🛠️ Панель ментора',
        action: this.cb('start'),
        priority: 30,
      };
    }
    return null;
  }

  // ── Приватные шаги wizard-а ──

  #startWizard(): BotResponse {
    return {
      sendMessage: {
        text: '🆕 *Создание нового потока*\n\nОтправьте название модуля или ID модуля.',
        parseMode: 'MarkdownV2',
      },
      captureInput: {
        path: WIZARD_PATH,
        context: {
          step: 0,
          moduleId: '',
          title: '',
          description: '',
          startDate: '',
          telegramGroupId: '',
        } satisfies CreateStreamWizardContext,
      },
    };
  }

  async #handleModuleMessage(
    ctx: CreateStreamWizardContext,
    text: string,
  ): Promise<BotResponse> {
    // Пытаемся найти модули по названию или используем текст как moduleId
    // В реальном коде здесь будет запрос к CourseFacade
    // Пока упрощённо: ждём, что пользователь нажмёт кнопку
    return {
      sendMessage: {
        text: '📦 Выберите модуль из списка или нажмите кнопку ниже.',
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

  async #onModuleSelected(
    action: string,
    session: SessionData,
  ): Promise<BotResponse> {
    const moduleId = action.split(':')[1]!;
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
        text: '📅 Введите дату старта в формате YYYY-MM-DD:',
      },
      captureInput: {
        path: WIZARD_PATH,
        context: { ...ctx, step: 3, description: text },
      },
    };
  }

  #handleDateInput(ctx: CreateStreamWizardContext, text: string): BotResponse {
    return {
      sendMessage: {
        text: '🔗 Введите ссылку на Telegram-группу потока:',
      },
      captureInput: {
        path: WIZARD_PATH,
        context: { ...ctx, step: 4, startDate: text },
      },
    };
  }

  async #handleGroupInput(
    ctx: CreateStreamWizardContext,
    text: string,
    actor: unknown,
  ): Promise<BotResponse> {
    const fullCtx: CreateStreamWizardContext = {
      ...ctx,
      step: 5,
      telegramGroupId: text,
    };
    const a = actor as Actor;

    await this.api.execute('create-stream', {
      title: fullCtx.title,
      description: fullCtx.description,
      moduleId: fullCtx.moduleId,
      startDate: fullCtx.startDate,
      telegramGroupId: fullCtx.telegramGroupId,
      mentorId: a.uuid,
    });

    return {
      releaseInput: true,
      sendMessage: {
        text: '✅ *Поток успешно создан!*',
        parseMode: 'MarkdownV2',
      },
    };
  }
}
