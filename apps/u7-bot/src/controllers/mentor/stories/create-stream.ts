import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { type MdText, md, mdConcat, mdJoin, mdRaw } from '@u7-scl/core/shared';
import type {
  BotSession,
  BotUpdate,
  CommandReaction,
  CommandUpdate,
  DialogResponse,
} from '@u7-scl/core/ui';
import { Status } from '@u7-scl/course/domain';

/** Тип команды создания потока (локально, для wizard-а) */
interface CreateStreamCmd {
  title: string;
  description: string;
  mentorId: string;
  moduleId: string;
  startDate: string;
  telegramGroupId: string;
  telegramGroupInvite?: string;
  goal?: string;
  result?: string;
  rules?: string;
  additional?: string;
  targetAudience?: string;
  enrollmentKey?: string;
}

/** Контекст wizard-а создания потока (живёт в dialog.input.context) */
interface CreateStreamWizardContext {
  step: number;
  moduleId: string;
  title: string;
  description: string;
  startDate: string;
  telegramGroupId: string;
  telegramGroupInvite: string;
  // Реальные значения для потока
  goal: string;
  result: string;
  rules: string;
  targetAudience: string;
  additional: string;
  enrollmentKey: string;
  // Кэш значений из модуля (для подсказок «По умолчанию»)
  moduleGoal: string;
  moduleResult: string;
  moduleRules: string;
  moduleTargetAudience: string;
  moduleAdditional: string;
}

/** Минимум полей модуля, которые wizard забирает в подсказки */
interface ModuleRow {
  title?: string;
  description?: string;
  goal?: string;
  result?: string;
  rules?: string;
  targetAudience?: string;
  additional?: string;
}

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
 * Шаг 9: ID/username Telegram-группы (необязательно)
 * Шаг 10: инвайт-ссылка на группу (необязательно)
 * Шаг 11: кодовое слово (необязательно)
 * Шаг 12: превью и подтверждение
 */
export class CreateStreamStory extends U7BotUiStory {
  readonly name = 'create-stream';

  async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
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

    // Пропуск кодового слова
    if (action === 'skip-key') {
      return this.#handleSkipEnrollmentKey(session);
    }

    // Пропуск инвайт-ссылки
    if (action === 'skip-invite') {
      return this.#handleSkipInvite(session);
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

    // Кнопка «Принять» для названия потока (шаг 1)
    if (action === 'accept-title') {
      return this.#handleAcceptTitle(session);
    }

    // Кнопка «Принять» для описания потока (шаг 2)
    if (action === 'accept-description') {
      return this.#handleAcceptDescription(session);
    }

    return this.unknownCommand(action, actor, session);
  }

  override async handleMessage(
    update: BotUpdate,
    _actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    if (update.type !== 'message') {
      // Wizard ждёт текст: документ/фото/кнопка — переспрос, ввод живёт
      return {
        notify: {
          text: md`⚠️ Ожидалось текстовое сообщение\\.`,
          kind: 'warn',
        },
      };
    }

    const context = session.dialog?.input?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!context) {
      return {
        notify: { text: md`⚠️ Контекст wizard\\-а потерян\\.`, kind: 'warn' },
        release: true,
      };
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
        return this.#handleGroupInput(context, update.text);
      case 10:
        return this.#handleInviteInput(context, update.text);
      case 11:
        return this.#handleEnrollmentKeyInput(context, update.text);
      case 12:
        return {
          notify: {
            text: md`👆 Используйте кнопки выше для подтверждения или изменения\\.`,
          },
        };
      default:
        return {
          notify: { text: md`⚠️ Неизвестный шаг wizard\\-а\\.`, kind: 'warn' },
        };
    }
  }

  /** /cancel: активный wizard — сброс с репликой; неактивный — pass. */
  override async handleCommand(
    update: CommandUpdate,
    _actor: User,
    session: BotSession,
  ): Promise<CommandReaction> {
    if (update.command === 'cancel' && this.isActive(session)) {
      this.reset();
      return {
        reaction: 'stop',
        response: {
          notify: { text: md`🚫 Создание потока отменено\\.`, kind: 'warn' },
          release: true,
        },
      };
    }
    return super.handleCommand(update, _actor, session);
  }

  // ── Приватные шаги wizard-а ──

  async #startWizard(): Promise<DialogResponse> {
    return this.#handleModuleMessage(this.#emptyCtx());
  }

  async #handleModuleMessage(
    ctx: CreateStreamWizardContext,
  ): Promise<DialogResponse> {
    const modules = (await this.appApi.execute('list-modules', {
      status: Status.PUBLISHED,
    })) as Array<{ uuid: string; title: string }>;

    if (!modules || modules.length === 0) {
      return {
        screen: {
          text: md`📦 *Нет доступных модулей*\n\nУ вас нет опубликованных модулей\\. Создайте модуль в конструкторе курсов\\.`,
          keyboard: {
            rows: [[{ text: '🔄 Обновить список', code: this.cb('start') }]],
            isMultiple: false,
          },
        },
        awaitInput: { context: ctx },
      };
    }

    const rows = modules.map((m) => [
      {
        text: m.title,
        code: `create-stream:module:${m.uuid}`,
      },
    ]);

    return {
      screen: {
        text: md`📦 *Выберите модуль курса\\:*`,
        keyboard: {
          rows,
          isMultiple: false,
        },
      },
      awaitInput: { context: ctx },
    };
  }

  async #onModuleSelected(
    action: string,
    session: BotSession,
  ): Promise<DialogResponse> {
    const moduleId = action.split(':')[1];
    if (!moduleId) {
      return this.unknownCommand(action);
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
      const module = (await this.appApi.execute('get-module', {
        uuid: moduleId,
      })) as ModuleRow;
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
      (session.dialog?.input?.context as
        | CreateStreamWizardContext
        | undefined) ?? this.#emptyCtx();

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
    const lines: MdText[] = [md`📝 Введите название потока\\:`];
    if (moduleTitle) {
      lines.push(md`_По умолчанию: «${moduleTitle}»_`);
    }

    const buttons: { text: string; code: string }[] = [];
    if (moduleTitle) {
      buttons.push({
        text: '✅ Принять',
        code: this.cb('accept-title'),
      });
    }

    return {
      screen: {
        text: mdJoin(lines),
        keyboard:
          buttons.length > 0
            ? { rows: [buttons], isMultiple: false }
            : undefined,
      },
      awaitInput: { context: ctx },
    };
  }

  #handleTitleInput(
    ctx: CreateStreamWizardContext,
    text: string,
  ): DialogResponse {
    const lines: MdText[] = [md`📄 Введите описание потока\\:`];
    if (ctx.description) {
      lines.push(md`_По умолчанию: «${ctx.description}»_`);
    }

    const buttons: { text: string; code: string }[] = [];
    if (ctx.description) {
      buttons.push({
        text: '✅ Принять',
        code: this.cb('accept-description'),
      });
    }

    return {
      screen: {
        text: mdJoin(lines),
        keyboard:
          buttons.length > 0
            ? { rows: [buttons], isMultiple: false }
            : undefined,
      },
      awaitInput: { context: { ...ctx, step: 2, title: text } },
    };
  }

  #handleDescriptionInput(
    ctx: CreateStreamWizardContext,
    text: string,
  ): DialogResponse {
    // Пример даты: сегодня + 5 дней, время 10:00
    const exampleDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const yyyy = exampleDate.getFullYear();
    const mm = String(exampleDate.getMonth() + 1).padStart(2, '0');
    const dd = String(exampleDate.getDate()).padStart(2, '0');
    const exampleStr = mdRaw(`${yyyy}\\-${mm}\\-${dd}T10:00`);

    return {
      screen: {
        text: mdConcat(
          md`📅 Введите дату старта в формате \`YYYY\\-MM\\-DD\` или дату время \`YYYY\\-MM\\-DDTHH\\:MM\`\\\\.\nНапример: \`${exampleStr}\`\\\\.`,
        ),
      },
      awaitInput: { context: { ...ctx, step: 3, description: text } },
    };
  }

  #handleDateInput(
    ctx: CreateStreamWizardContext,
    text: string,
  ): DialogResponse {
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
  ): DialogResponse {
    const moduleValue: string = ctx[field.moduleKey] || '';
    const lines: MdText[] = [md`📝 *${field.label}*`];

    const buttons: { text: string; code: string }[] = [];

    if (moduleValue) {
      lines.push(md`_По умолчанию: «${moduleValue}»_`);
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
      screen: {
        text: mdJoin(lines),
        keyboard: {
          rows: [buttons],
          isMultiple: false,
        },
      },
      awaitInput: { context: ctx },
    };
  }

  /** Обработчик ввода текста для необязательного поля */
  #handleOptionalFieldInput(
    field: OptionalFieldConfig,
    ctx: CreateStreamWizardContext,
    text: string,
  ): DialogResponse {
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

    // После последнего необязательного поля (additional → шаг 9: группа)
    return this.#showGroupStep(nextCtx);
  }

  /** Обработчик кнопки «Принять» */
  #handleAcceptField(
    field: OptionalFieldConfig,
    session: BotSession,
  ): DialogResponse {
    const ctx = session.dialog?.input?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!ctx) return this.#lostContext();

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
    return this.#showGroupStep(nextCtx);
  }

  /** Обработчик кнопки «Пропустить» */
  #handleSkipField(
    field: OptionalFieldConfig,
    session: BotSession,
  ): DialogResponse {
    const ctx = session.dialog?.input?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!ctx) return this.#lostContext();

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
    return this.#showGroupStep(nextCtx);
  }

  #handleAcceptTitle(session: BotSession): DialogResponse {
    const ctx = session.dialog?.input?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!ctx) return this.#lostContext();

    // Берём название из уже загруженного контекста (title заполнен в #onModuleSelected)
    const title = ctx.title || ctx.moduleId;
    const lines: MdText[] = [md`📄 Введите описание потока\\:`];
    if (ctx.description) {
      lines.push(md`_По умолчанию: «${ctx.description}»_`);
    }

    const buttons: { text: string; code: string }[] = [];
    if (ctx.description) {
      buttons.push({
        text: '✅ Принять',
        code: this.cb('accept-description'),
      });
    }

    return {
      screen: {
        text: mdJoin(lines),
        keyboard:
          buttons.length > 0
            ? { rows: [buttons], isMultiple: false }
            : undefined,
      },
      awaitInput: { context: { ...ctx, step: 2, title } },
    };
  }

  #handleAcceptDescription(session: BotSession): DialogResponse {
    const ctx = session.dialog?.input?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!ctx) return this.#lostContext();

    return this.#handleDescriptionInput(ctx, ctx.description);
  }

  #stepToField(step: number): string | undefined {
    const found = OPTIONAL_FIELDS.find((_f, idx) => idx + 4 === step);
    return found?.fieldName;
  }

  // ── Группа и превью ──

  async #handleGroupInput(
    ctx: CreateStreamWizardContext,
    text: string,
  ): Promise<DialogResponse> {
    const nextCtx: CreateStreamWizardContext = {
      ...ctx,
      step: 10,
      telegramGroupId: text,
    };

    return this.#showInviteStep(nextCtx);
  }

  #handleSkipGroup(session: BotSession): DialogResponse {
    const ctx = session.dialog?.input?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!ctx) return this.#lostContext();
    const nextCtx: CreateStreamWizardContext = {
      ...ctx,
      step: 10,
      telegramGroupId: '',
    };
    return this.#showInviteStep(nextCtx);
  }

  // ── Группа: показ шагов и инвайт-ссылка ──

  #showGroupStep(ctx: CreateStreamWizardContext): DialogResponse {
    return {
      screen: {
        text: md`🔗 Введите ID или username Telegram\\-группы потока — по нему бот сможет исключать \\(кикать\\) студентов \\(необязательно\\)\\:`,
        keyboard: {
          rows: [[{ text: '⏭️ Пропустить', code: this.cb('skip-group') }]],
          isMultiple: false,
        },
      },
      awaitInput: { context: ctx },
    };
  }

  #showInviteStep(ctx: CreateStreamWizardContext): DialogResponse {
    return {
      screen: {
        text: md`🔗 Введите инвайт\\-ссылку на группу потока — по ней студенты попадут в группу \\(необязательно\\)\\:`,
        keyboard: {
          rows: [[{ text: '⏭️ Пропустить', code: this.cb('skip-invite') }]],
          isMultiple: false,
        },
      },
      awaitInput: { context: ctx },
    };
  }

  #handleInviteInput(
    ctx: CreateStreamWizardContext,
    text: string,
  ): DialogResponse {
    return this.#showEnrollmentKeyStep({
      ...ctx,
      step: 11,
      telegramGroupInvite: text,
    });
  }

  #handleSkipInvite(session: BotSession): DialogResponse {
    const ctx = session.dialog?.input?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!ctx) return this.#lostContext();
    return this.#showEnrollmentKeyStep({
      ...ctx,
      step: 11,
      telegramGroupInvite: '',
    });
  }

  // ── Кодовое слово ──

  #showEnrollmentKeyStep(ctx: CreateStreamWizardContext): DialogResponse {
    return {
      screen: {
        text: md`🔑 Введите кодовое слово для записи на поток \\(необязательно\\)\\. Оставьте пустым для свободной записи\\.`,
        keyboard: {
          rows: [[{ text: '⏭️ Пропустить', code: this.cb('skip-key') }]],
          isMultiple: false,
        },
      },
      awaitInput: { context: ctx },
    };
  }

  #handleEnrollmentKeyInput(
    ctx: CreateStreamWizardContext,
    text: string,
  ): DialogResponse {
    return this.#showPreview({
      ...ctx,
      step: 12,
      enrollmentKey: text,
    });
  }

  #handleSkipEnrollmentKey(session: BotSession): DialogResponse {
    const ctx = session.dialog?.input?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!ctx) return this.#lostContext();
    return this.#showPreview({
      ...ctx,
      step: 12,
      enrollmentKey: '',
    });
  }

  // ── Шаг превью ──

  #showPreview(ctx: CreateStreamWizardContext): DialogResponse {
    const lines: MdText[] = [
      md`📋 *Превью потока*`,
      md``,
      md`*Название\\:* ${ctx.title}`,
      md`*Описание\\:* ${ctx.description}`,
      md`*Дата старта\\:* ${ctx.startDate}`,
    ];

    if (ctx.telegramGroupId)
      lines.push(md`*ID группы\\:* ${ctx.telegramGroupId}`);
    if (ctx.telegramGroupInvite)
      lines.push(md`*Ссылка для студентов\\:* ${ctx.telegramGroupInvite}`);

    if (ctx.goal) lines.push(md`*Цель\\:* ${ctx.goal}`);
    if (ctx.result) lines.push(md`*Результат\\:* ${ctx.result}`);
    if (ctx.rules) lines.push(md`*Правила\\:* ${ctx.rules}`);
    if (ctx.targetAudience)
      lines.push(md`*Аудитория\\:* ${ctx.targetAudience}`);
    if (ctx.additional) lines.push(md`*Дополнительно\\:* ${ctx.additional}`);

    if (ctx.enrollmentKey)
      lines.push(md`*Кодовое слово\\:* ${ctx.enrollmentKey}`);

    lines.push(md``, md`Всё верно\\?`);

    return {
      screen: {
        text: mdJoin(lines),
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
      awaitInput: { context: ctx },
    };
  }

  async #handleConfirm(
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    const context = session.dialog?.input?.context as
      | CreateStreamWizardContext
      | undefined;
    if (!context) {
      return {
        notify: {
          text: md`⚠️ Контекст wizard\\-а потерян\\. Начните заново\\.`,
          kind: 'warn',
        },
        release: true,
      };
    }

    const cmd: CreateStreamCmd = {
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
    if (context.enrollmentKey) cmd.enrollmentKey = context.enrollmentKey;
    if (context.telegramGroupInvite)
      cmd.telegramGroupInvite = context.telegramGroupInvite;

    try {
      await this.appApi.execute('create-stream', cmd, actor.uuid);
    } catch (err: unknown) {
      return this.handleError(err);
    }

    return {
      release: true,
      screen: {
        text: md`✅ *Поток успешно создан\\\\!*`,
      },
    };
  }

  // ── Вспомогательные ──

  /** Реплика о потере контекста wizard-а: ввод не держится мёртвым. */
  #lostContext(): DialogResponse {
    return {
      notify: { text: md`⚠️ Контекст wizard\\-а потерян\\.`, kind: 'warn' },
      release: true,
    };
  }

  #emptyCtx(): CreateStreamWizardContext {
    return {
      step: 0,
      moduleId: '',
      title: '',
      description: '',
      startDate: '',
      telegramGroupId: '',
      telegramGroupInvite: '',
      goal: '',
      result: '',
      rules: '',
      targetAudience: '',
      additional: '',
      enrollmentKey: '',
      moduleGoal: '',
      moduleResult: '',
      moduleRules: '',
      moduleTargetAudience: '',
      moduleAdditional: '',
    };
  }
}
