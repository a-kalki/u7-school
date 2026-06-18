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
  // Реальные значения для потока
  goal: string;
  result: string;
  rules: string;
  targetAudience: string;
  additional: string;
  // Кэш значений из модуля (для подсказок «По умолчанию»)
  moduleGoal: string;
  moduleResult: string;
  moduleRules: string;
  moduleTargetAudience: string;
  moduleAdditional: string;
}

const WIZARD_PATH = 'create-stream/wizard';

/** Описание одного необязательного поля */
interface OptionalFieldConfig {
  fieldName: 'goal' | 'result' | 'rules' | 'targetAudience' | 'additional';
  label: string;
  moduleKey:
    | 'moduleGoal'
    | 'moduleResult'
    | 'moduleRules'
    | 'moduleTargetAudience'
    | 'moduleAdditional';
  nextStep: number;
}

const OPTIONAL_FIELDS: OptionalFieldConfig[] = [
  { fieldName: 'goal', label: 'Цель', moduleKey: 'moduleGoal', nextStep: 5 },
  {
    fieldName: 'result',
    label: 'Результат',
    moduleKey: 'moduleResult',
    nextStep: 6,
  },
  {
    fieldName: 'rules',
    label: 'Правила',
    moduleKey: 'moduleRules',
    nextStep: 7,
  },
  {
    fieldName: 'targetAudience',
    label: 'Целевая аудитория',
    moduleKey: 'moduleTargetAudience',
    nextStep: 8,
  },
  {
    fieldName: 'additional',
    label: 'Дополнительно',
    moduleKey: 'moduleAdditional',
    nextStep: 9,
  },
];

/**
 * US-6: Пошаговый wizard создания потока.
 * Шаг 0: выбор модуля (реальный список через appApi)
 * Шаг 1: название потока (текст, предзаполнено из модуля)
 * Шаг 2: описание (текст, предзаполнено из модуля)
 * Шаг 3: дата старта (текст, YYYY-MM-DD)
 * Шаг 4: цель (goal) — из модуля или ввод
 * Шаг 5: результат (result)
 * Шаг 6: правила (rules)
 * Шаг 7: целевая аудитория (targetAudience)
 * Шаг 8: дополнительно (additional)
 * Шаг 9: ссылка на Telegram-группу (необязательно)
 * Шаг 10: превью и подтверждение
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

    // Обработчики «Принять» / «Пропустить» для необязательных полей модуля
    for (const field of OPTIONAL_FIELDS) {
      if (action === `accept-${field.fieldName}`) {
        return this.#handleAcceptField(field, session);
      }
      if (action === `skip-${field.fieldName}`) {
        return this.#handleSkipField(field, session);
      }
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

    // Шаги 4-8: необязательные поля модуля
    const field = OPTIONAL_FIELDS.find(
      (f) => f.fieldName === this.#stepToField(context.step),
    );
    if (field) {
      return this.#handleOptionalFieldInput(field, context, update.text);
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
      case 9:
        return this.#handleGroupInput(context, update.text, actor);
      case 10:
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
    return this.#handleModuleMessage(this.#emptyCtx());
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

    const existingCtx =
      (session.activeHandler?.context as CreateStreamWizardContext) ??
      this.#emptyCtx();

    const ctx: CreateStreamWizardContext = {
      ...existingCtx,
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

    // Сообщение с подсказкой о предзаполненном названии
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

    // OPTIONAL_FIELDS всегда непустой
    const firstField = OPTIONAL_FIELDS[0] as OptionalFieldConfig;
    return this.#showOptionalFieldStep(
      { ...ctx, step: 4, startDate: normalizedDate },
      firstField,
    );
  }

  // ── Общий механизм для необязательных полей ──

  /** Показывает шаг для необязательного поля */
  #showOptionalFieldStep(
    ctx: CreateStreamWizardContext,
    field: OptionalFieldConfig,
  ): BotResponse {
    const moduleValue: string = ctx[field.moduleKey] || '';
    const lines = [`📝 *${field.label}*`];

    const buttons: { text: string; code: string }[] = [];

    if (moduleValue) {
      lines.push(`_По умолчанию: «${this.escapeMarkdown(moduleValue)}»_`);
      buttons.push({
        text: '✅ Принять',
        code: this.cb(`accept-${field.fieldName}`),
      });
    }

    buttons.push({
      text: '⏭️ Пропустить',
      code: this.cb(`skip-${field.fieldName}`),
    });

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
        keyboard: {
          rows: [buttons],
          isMultiple: false,
        },
      },
      captureInput: {
        path: WIZARD_PATH,
        context: ctx,
      },
    };
  }

  /** Обработчик ввода текста для необязательного поля */
  #handleOptionalFieldInput(
    field: OptionalFieldConfig,
    ctx: CreateStreamWizardContext,
    text: string,
  ): BotResponse {
    const nextCtx: CreateStreamWizardContext = {
      ...ctx,
      step: field.nextStep,
      [field.fieldName]: text,
    };

    const nextField = OPTIONAL_FIELDS.find(
      (f) => f.fieldName === this.#stepToField(field.nextStep),
    );
    if (nextField) {
      return this.#showOptionalFieldStep(nextCtx, nextField);
    }

    // После последнего необязательного поля (additional → step 9: группа)
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
        context: nextCtx,
      },
    };
  }

  /** Обработчик кнопки «Принять» */
  #handleAcceptField(
    field: OptionalFieldConfig,
    session: SessionData,
  ): BotResponse {
    const ctx = session.activeHandler?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!ctx) return { sendMessage: { text: '⚠️ Контекст потерян' } };

    const moduleValue: string = ctx[field.moduleKey] || '';
    const nextCtx: CreateStreamWizardContext = {
      ...ctx,
      step: field.nextStep,
      [field.fieldName]: moduleValue,
    };

    const nextField = OPTIONAL_FIELDS.find(
      (f) => f.fieldName === this.#stepToField(field.nextStep),
    );
    if (nextField) {
      return this.#showOptionalFieldStep(nextCtx, nextField);
    }

    // Переход к группе
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
        context: nextCtx,
      },
    };
  }

  /** Обработчик кнопки «Пропустить» */
  #handleSkipField(
    field: OptionalFieldConfig,
    session: SessionData,
  ): BotResponse {
    const ctx = session.activeHandler?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!ctx) return { sendMessage: { text: '⚠️ Контекст потерян' } };

    const nextCtx: CreateStreamWizardContext = {
      ...ctx,
      step: field.nextStep,
      [field.fieldName]: '',
    };

    const nextField = OPTIONAL_FIELDS.find(
      (f) => f.fieldName === this.#stepToField(field.nextStep),
    );
    if (nextField) {
      return this.#showOptionalFieldStep(nextCtx, nextField);
    }

    // Переход к группе
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
        context: nextCtx,
      },
    };
  }

  #stepToField(step: number): string | undefined {
    const found = OPTIONAL_FIELDS.find((_f, idx) => idx + 4 === step);
    return found?.fieldName;
  }

  // ── Группа и превью ──

  async #handleGroupInput(
    ctx: CreateStreamWizardContext,
    text: string,
    _actor: User,
  ): Promise<BotResponse> {
    const fullCtx: CreateStreamWizardContext = {
      ...ctx,
      step: 10,
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
      step: 10,
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

    if (ctx.goal) lines.push(`*Цель:* ${this.escapeMarkdown(ctx.goal)}`);
    if (ctx.result)
      lines.push(`*Результат:* ${this.escapeMarkdown(ctx.result)}`);
    if (ctx.rules) lines.push(`*Правила:* ${this.escapeMarkdown(ctx.rules)}`);
    if (ctx.targetAudience)
      lines.push(`*Аудитория:* ${this.escapeMarkdown(ctx.targetAudience)}`);
    if (ctx.additional)
      lines.push(`*Дополнительно:* ${this.escapeMarkdown(ctx.additional)}`);

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

    try {
      await this.moduleApi.execute('create-stream', cmd, actor.uuid);
    } catch (err: unknown) {
      const error = err as Error & {
        details?: Array<{ field: string; message: string }>;
      };
      let messageText = '⚠️ *Ошибка валидации*';

      if (error.details && error.details.length > 0) {
        const detailLines = error.details.map(
          (d) => `• ${d.field}: ${d.message}`,
        );
        messageText += `\n\n${detailLines.join('\n')}`;
      } else {
        messageText += `\n\n${error.message}`;
      }

      messageText += '\n\nПожалуйста, начните создание потока заново.';

      return {
        releaseInput: true,
        sendMessage: {
          text: messageText,
          parseMode: 'MarkdownV2',
        },
      };
    }

    return {
      releaseInput: true,
      sendMessage: {
        text: '✅ *Поток успешно создан\\!*',
        parseMode: 'MarkdownV2',
      },
    };
  }

  // ── Вспомогательные ──

  #emptyCtx(): CreateStreamWizardContext {
    return {
      step: 0,
      moduleId: '',
      title: '',
      description: '',
      startDate: '',
      telegramGroupId: '',
      goal: '',
      result: '',
      rules: '',
      targetAudience: '',
      additional: '',
      moduleGoal: '',
      moduleResult: '',
      moduleRules: '',
      moduleTargetAudience: '',
      moduleAdditional: '',
    };
  }
}
