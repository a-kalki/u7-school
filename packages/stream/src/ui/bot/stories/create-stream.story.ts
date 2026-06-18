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
  // Необязательные поля из модуля
  goal?: string;
  result?: string;
  rules?: string;
  targetAudience?: string;
  additional?: string;
  // Кэш полей модуля для показа сводки
  moduleGoal?: string;
  moduleResult?: string;
  moduleRules?: string;
  moduleTargetAudience?: string;
  moduleAdditional?: string;
}

const WIZARD_PATH = 'create-stream/wizard';

/**
 * US-6: Пошаговый wizard создания потока.
 * Шаг 0: выбор модуля (реальный список через appApi)
 * Шаг 1: название потока (текст, предзаполнено из модуля)
 * Шаг 2: описание (текст, предзаполнено из модуля)
 * Шаг 3: дата старта (текст, YYYY-MM-DD)
 * Шаг 4: ссылка на Telegram-группу (текст, необязательно)
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

    // Кнопка «По умолчанию» для необязательных полей модуля
    if (action === 'use-defaults') {
      return this.#handleUseDefaults(session);
    }

    // Пропуск необязательных полей модуля
    if (action === 'skip-defaults') {
      return this.#handleSkipDefaults(session);
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

    // Загружаем данные модуля через appApi
    let moduleTitle = '';
    let moduleDescription = '';
    let moduleGoal = '';
    let moduleResult = '';
    let moduleRules = '';
    let moduleTargetAudience = '';
    let moduleAdditional = '';

    try {
      const module = await this.appApi.execute('get-module', {
        uuid: moduleId,
      });
      moduleTitle = module.title ?? '';
      moduleDescription = module.description ?? '';
      moduleGoal = module.goal ?? '';
      moduleResult = module.result ?? '';
      moduleRules = module.rules ?? '';
      moduleTargetAudience = module.targetAudience ?? '';
      moduleAdditional = module.additional ?? '';
    } catch {
      // Модуль не найден — оставляем поля пустыми
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
      title: moduleTitle,
      description: moduleDescription,
      moduleGoal,
      moduleResult,
      moduleRules,
      moduleTargetAudience,
      moduleAdditional,
    };

    // Сообщение с подсказкой о предзаполненных значениях
    const lines = ['📝 Введите название потока:'];
    if (moduleTitle) {
      lines.push(`_По умолчанию: «${this.escapeMarkdown(moduleTitle)}»_`);
    }

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
      },
      captureInput: {
        path: WIZARD_PATH,
        context: ctx,
      },
    };
  }

  #handleTitleInput(ctx: CreateStreamWizardContext, text: string): BotResponse {
    const lines = ['📄 Введите описание потока:'];
    if (ctx.description) {
      lines.push(`_По умолчанию: «${this.escapeMarkdown(ctx.description)}»_`);
    }

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
      },
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
    const normalizedDate = text.includes('T') ? text : `${text}T00:00`;

    // Проверяем, есть ли необязательные поля модуля для показа сводки
    const optionalFields = [
      { label: 'Цель', value: ctx.moduleGoal },
      { label: 'Результат', value: ctx.moduleResult },
      { label: 'Правила', value: ctx.moduleRules },
      { label: 'Целевая аудитория', value: ctx.moduleTargetAudience },
      { label: 'Дополнительно', value: ctx.moduleAdditional },
    ].filter((f) => f.value);

    if (optionalFields.length === 0) {
      // Нет необязательных полей — сразу переходим к группе
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

    // Показываем сводку необязательных полей с кнопками
    const lines = [
      '📋 *Поля модуля для потока*',
      '',
      ...optionalFields.map(
        (f) => `• *${f.label}:* ${this.escapeMarkdown(f.value ?? '')}`,
      ),
      '',
      'Использовать эти значения для потока?',
    ];

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [
            [
              { text: '✅ По умолчанию', code: this.cb('use-defaults') },
              { text: '⏭️ Пропустить', code: this.cb('skip-defaults') },
            ],
          ],
          isMultiple: false,
        },
      },
      captureInput: {
        path: WIZARD_PATH,
        context: { ...ctx, step: 3, startDate: normalizedDate },
      },
    };
  }

  #handleUseDefaults(session: SessionData): BotResponse {
    const ctx = session.activeHandler?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!ctx) {
      return { sendMessage: { text: '⚠️ Контекст wizard-а потерян' } };
    }

    const fullCtx: CreateStreamWizardContext = {
      ...ctx,
      step: 4,
      goal: ctx.moduleGoal,
      result: ctx.moduleResult,
      rules: ctx.moduleRules,
      targetAudience: ctx.moduleTargetAudience,
      additional: ctx.moduleAdditional,
    };

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
        context: fullCtx,
      },
    };
  }

  #handleSkipDefaults(session: SessionData): BotResponse {
    const ctx = session.activeHandler?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!ctx) {
      return { sendMessage: { text: '⚠️ Контекст wizard-а потерян' } };
    }

    const fullCtx: CreateStreamWizardContext = {
      ...ctx,
      step: 4,
    };

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
        context: fullCtx,
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
    ];

    // Показываем необязательные поля, если они заданы
    if (
      ctx.goal ||
      ctx.result ||
      ctx.rules ||
      ctx.targetAudience ||
      ctx.additional
    ) {
      lines.push('');
      if (ctx.goal) lines.push(`*Цель:* ${this.escapeMarkdown(ctx.goal)}`);
      if (ctx.result)
        lines.push(`*Результат:* ${this.escapeMarkdown(ctx.result)}`);
      if (ctx.rules) lines.push(`*Правила:* ${this.escapeMarkdown(ctx.rules)}`);
      if (ctx.targetAudience)
        lines.push(`*Аудитория:* ${this.escapeMarkdown(ctx.targetAudience)}`);
      if (ctx.additional)
        lines.push(`*Дополнительно:* ${this.escapeMarkdown(ctx.additional)}`);
    }

    lines.push('', 'Всё верно?');

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

    const cmd: {
      title: string;
      description: string;
      moduleId: string;
      startDate: string;
      telegramGroupId?: string;
      mentorId: string;
      goal?: string;
      result?: string;
      rules?: string;
      targetAudience?: string;
      additional?: string;
    } = {
      title: context.title,
      description: context.description,
      moduleId: context.moduleId,
      startDate: context.startDate,
      telegramGroupId: context.telegramGroupId,
      mentorId: actor.uuid,
    };

    // Добавляем необязательные поля, если они заданы
    if (context.goal) cmd.goal = context.goal;
    if (context.result) cmd.result = context.result;
    if (context.rules) cmd.rules = context.rules;
    if (context.targetAudience) cmd.targetAudience = context.targetAudience;
    if (context.additional) cmd.additional = context.additional;

    await this.moduleApi.execute('create-stream', cmd, actor.uuid);

    return {
      releaseInput: true,
      sendMessage: {
        text: '✅ *Поток успешно создан\\!*',
        parseMode: 'MarkdownV2',
      },
    };
  }
}
