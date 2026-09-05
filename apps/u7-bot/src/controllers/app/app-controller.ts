import type { User } from '@u7-scl/app/domain';
import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import type { MainMenuAction } from '@u7-scl/bot/u7-menu';
import { md, mdConcat, mdJoin } from '@u7-scl/core/shared';
import type { BotSession, DialogResponse, Screen } from '@u7-scl/core/ui';
import { CommunityStory } from './stories/community.story';

/**
 * Контроллер уровня приложения для системных сценариев:
 * - Приветствие /start (handleWelcome — экран меню)
 * - Помощь /help (handleHelpMessage — общий fallback)
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
   * Приветствие /start: greeting + главное меню (экран диалога app/menu).
   */
  override async handleWelcome(actor: User): Promise<Screen | null> {
    const name = actor.name;
    const greeting = md`Привет, ${name}! 👋

Я бот-помощник школы «u7 schools» 🎓
Я проведу тебя от знакомства до обучения на курсах.

Если ты здесь впервые — начни с кнопки «❓ Помощь», расскажу как всё устроено.
Если уже знаком — выбирай нужный раздел:`;

    return this.#buildMenuScreen(greeting, actor);
  }

  /**
   * Помощь /help: инструкция + список описаний кнопок.
   * Уходит info-репликой — клавиатура не рендерится (диалог не трогаем).
   */
  override async handleHelpMessage(actor: User): Promise<Screen | null> {
    const header = md`Как со мной работать? 🤔

В основном ты будешь нажимать на кнопки — это быстро и удобно. Иногда я попрошу написать что-то самому (например, ответ на вопрос анкеты).

📌 После выбора кнопки я убираю клавиатуру и добавляю пометку «Вы выбрали: ...» — чтобы экран оставался чистым.
📌 В некоторых сценариях (например, заполнение анкеты) работает команда /cancel — она вернёт тебя обратно к выбору.

Вот что я умею:`;

    const descriptions = await this.uiApp.collectAllHelpDescriptions(actor);

    if (descriptions.length === 0) {
      return { text: header };
    }

    // Композиция: header уже MdText, интерполяция экранировала бы повторно
    const parts = descriptions.map((d) => md`${d}`);
    return {
      text: mdConcat(header, md`\n\n`, mdJoin(parts, '\n\n')),
    };
  }

  // ── Callback ──

  override async handleCallback(
    data: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    if (data === 'main-menu') {
      return {
        screen: await this.#buildMenuScreen(md`Выберите действие:`, actor),
      };
    }

    if (data === 'help') {
      const helpScreen = await this.handleHelpMessage(actor);
      return { info: helpScreen ?? { text: md`Нет доступных пунктов меню.` } };
    }

    // Делегируем в stories (например, CommunityStory)
    for (const story of this.stories) {
      const prefix = `${story.name}:`;
      if (data.startsWith(prefix)) {
        const raw = data.slice(prefix.length);
        return story.handleCallback(raw, actor, session);
      }
    }

    return { screen: { text: md`⚠️ Неизвестная команда` } };
  }

  // ── Приватные ──

  /**
   * Формирует экран меню: текст + клавиатура из MenuAggregator.
   */
  async #buildMenuScreen(title: Screen['text'], actor: User): Promise<Screen> {
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

    return { text: title, keyboard };
  }
}
