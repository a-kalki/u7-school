import type { User } from '@u7-scl/app/domain';
import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import type { BotResponse, MainMenuAction, SessionData } from '@u7-scl/core/ui';
import { buttons } from '../shared/buttons';
import { CommunityStory } from './stories/community.story';

/**
 * Контроллер уровня приложения для системных сценариев:
 * - Приветствие /start (handleWelcome)
 * - Помощь /help (handleHelpMessage)
 * - Кнопки «Сообщество школы» и «Помощь»
 * - Callback'и app:main-menu и app:help
 */
export class AppController extends U7BotController {
  readonly name = 'app';
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: присваивается в конструкторе, требуется для инициализации
  readonly #groupUrl: string;

  /**
   * @param schoolGroupUrl — URL группы школы (обязателен)
   */
  constructor(schoolGroupUrl: string) {
    super();
    this.#groupUrl = schoolGroupUrl;
    this.stories.push(new CommunityStory(schoolGroupUrl));
  }

  // ── Главное меню ──

  override async handleStart(actor: User): Promise<MainMenuAction[]> {
    // Получаем кнопки от stories через базовый механизм (с префиксами)
    const items = await super.handleStart(actor);

    // Кнопка «Сообщество школы» уже добавлена через CommunityStory с priority 90.
    // Кнопка «Помощь» — priority 100 (ниже сообщества)
    items.push({
      kind: 'callback',
      text: '❓ Помощь',
      action: this.cb('help'),
      priority: 100,
    });

    return items.sort((a, b) => a.priority - b.priority);
  }

  // ── Системные сообщения ──

  /**
   * Приветствие /start: greeting + главное меню.
   */
  override async handleWelcome(actor: User): Promise<BotResponse | null> {
    const name = actor.name;
    const greeting = [
      `Привет, ${name}! 👋`,
      '',
      'Я бот-помощник школы «u7 schools» 🎓',
      'Я проведу тебя от знакомства до обучения на курсах.',
      '',
      'Если ты здесь впервые — начни с кнопки «❓ Помощь», расскажу как всё устроено.',
      'Если уже знаком — выбирай нужный раздел:',
    ].join('\n');

    return this.#buildMenuResponse(greeting, actor);
  }

  /**
   * Помощь /help: инструкция + список описаний кнопок + кнопка «Назад».
   */
  override async handleHelpMessage(actor: User): Promise<BotResponse | null> {
    const header = [
      'Как со мной работать? 🤔',
      '',
      'В основном ты будешь нажимать на кнопки — это быстро и удобно. Иногда я попрошу написать что-то самому (например, ответ на вопрос анкеты).',
      '',
      '📌 После выбора кнопки я убираю клавиатуру и добавляю пометку «Вы выбрали: ...» — чтобы экран оставался чистым.',
      '📌 В некоторых сценариях (например, заполнение анкеты) работает команда /cancel — она вернёт тебя обратно к выбору.',
      '',
      'Вот что я умею:',
    ].join('\n');

    const descriptions = await this.uiApp.collectAllHelpDescriptions(actor);

    const body =
      descriptions.length > 0 ? `\n\n${descriptions.join('\n\n')}` : '';

    return {
      sendMessage: {
        text: header + body,
        keyboard: {
          rows: [[buttons.mainMenu('🔙 Назад')]],
          isMultiple: false,
        },
      },
    };
  }

  // ── Callback ──

  override async handleCallback(
    data: string,
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    if (data === 'main-menu') {
      return this.#buildMenuResponse('Выберите действие:', actor);
    }

    if (data === 'help') {
      const helpRes = await this.handleHelpMessage(actor);
      return (
        helpRes ?? { sendMessage: { text: 'Нет доступных пунктов меню.' } }
      );
    }

    // Делегируем в stories (например, CommunityStory)
    for (const story of this.stories) {
      const prefix = `${story.name}:`;
      if (data.startsWith(prefix)) {
        const raw = data.slice(prefix.length);
        return story.handleCallback(raw, actor, session);
      }
    }

    return { sendMessage: { text: '⚠️ Неизвестная команда' } };
  }

  // ── Приватные ──

  /**
   * Формирует BotResponse с текстом и клавиатурой из MenuAggregator.
   */
  async #buildMenuResponse(title: string, actor: User): Promise<BotResponse> {
    const items = this.uiApp ? await this.uiApp.collectAllMenuItems(actor) : [];

    // Формируем клавиатуру: каждая кнопка в отдельном ряду
    const rows = items
      .filter((i) => i.kind === 'callback' || i.kind === 'url')
      .map((i) => [
        i.kind === 'url'
          ? { text: i.text, code: '', url: i.url }
          : {
              text: i.text,
              code: (i as { action: string }).action,
            },
      ]);

    const keyboard =
      rows.length > 0 ? { rows, isMultiple: false as const } : undefined;

    return {
      sendMessage: {
        text: title,
        keyboard,
      },
    };
  }
}
