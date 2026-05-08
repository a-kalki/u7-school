import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { AutoUiCliController } from "@u7/core/ui";
import type { AutoUiApp } from "@u7/core/ui";

/**
 * Контроллер CLI для модуля пользователей.
 * Расширяет AutoUiCliController, реализуя конкретный UX для /register и /login.
 *
 * Явно знает структуру модуля user:
 * - /user/user/create-user
 * - /user/user/list-users
 * - /user/user/get-user-by-telegram-id
 */
export class UserCliController extends AutoUiCliController {
  constructor(app: AutoUiApp) {
    super(app);
  }

  // ── CLI-окружение ──

  createReadline(): readline.Interface {
    return readline.createInterface({ input, output });
  }

  writePrompt(): void {
    process.stdout.write("\n> ");
  }

  handleQuit(): void {
    console.log("До свидания!");
  }

  // ── Auth ──

  /**
   * Обработка /register.
   * Направляет на create-user и оформляет заголовком.
   */
  async handleRegister(): Promise<string> {
    const response = await this.safeHandle("/user/user/create-user");
    return `**Регистрация первого администратора**\n\n${response}`;
  }

  /**
   * Обработка /login [args].
   *
   * Поддерживаемые форматы:
   * - /login                    — список пользователей
   * - /login <uuid>             — вход по UUID
   * - /login uuid: <uuid>       — вход по UUID (явный)
   * - /login telegramId: <num>  — вход по Telegram ID
   * - /login name: <часть>      — поиск по имени
   */
  async handleLogin(args?: string): Promise<string> {
    // Без аргументов — список пользователей
    if (!args) {
      return this.renderLoginList();
    }

    // Парсим аргументы
    const colonIndex = args.indexOf(":");
    const hasPrefix = colonIndex > 0;

    if (!hasPrefix) {
      // Простое значение — считаем UUID
      return this.loginById(args.trim());
    }

    const prefix = args.slice(0, colonIndex).trim().toLowerCase();
    const value = args.slice(colonIndex + 1).trim();

    switch (prefix) {
      case "uuid":
        return this.loginById(value);
      case "telegramid":
        return this.loginByTelegramId(value);
      case "name":
        return this.loginByName(value);
      default:
        return `**Ошибка:** Неизвестный способ входа \`${prefix}:\`. Используйте \`uuid:\`, \`telegramId:\` или \`name:\`.`;
    }
  }

  /**
   * Рендеринг меню в зависимости от состояния:
   * - Нет пользователей → /register
   * - Есть, без сессии → /login
   * - Есть сессия → актуальный actorId
   */
  async renderMenu(): Promise<string> {
    let menu = "\n\n---\n**Меню:**\n- Список модулей: `/modules`\n";

    const actor = this.currentActor;

    if (actor) {
      menu += `- Активный пользователь: ${actor.name} \`${actor.uuid}\`\n`;
      return menu;
    }

    try {
      const response = await this.safeHandle("/user/user/list-users");
      const data = JSON.parse(response) as { users?: unknown[] };
      const hasUsers = (data.users?.length ?? 0) > 0;

      if (!hasUsers) {
        menu += "- **Регистрация администратора:** `/register`\n";
      } else {
        menu += "- **Вход в систему:** `/login`\n";
      }
    } catch {
      // Fallback: предлагаем регистрацию
      menu += "- **Регистрация администратора:** `/register`\n";
    }

    return menu;
  }

  // ── Приватные хелперы ──

  /**
   * Показывает список пользователей для выбора при логине.
   */
  private async renderLoginList(): Promise<string> {
    try {
      const response = await this.safeHandle("/user/user/list-users");
      const data = JSON.parse(response) as {
        users?: Array<{ uuid: string; name: string }>;
      };

      if (!data.users || data.users.length === 0) {
        return "Нет зарегистрированных пользователей. Введите `/register` для создания первого администратора.";
      }

      let output = "**Выберите пользователя:**\n\n";
      for (const user of data.users) {
        output += `- ${user.name}: \`/login ${user.uuid}\`\n`;
      }
      output +=
        "\nВведите `/login <id>` для входа, или `/login name: <имя>` для поиска.";
      return output;
    } catch {
      return "**Ошибка:** Не удалось получить список пользователей.";
    }
  }

  /**
   * Вход по ID (UUID) с проверкой существования пользователя.
   */
  private async loginById(id: string): Promise<string> {
    try {
      // Проверяем, существует ли пользователь с таким UUID
      const response = await this.safeHandle("/user/user/list-users");
      const data = JSON.parse(response) as {
        users?: Array<{ uuid: string; name: string }>;
      };

      const user = data.users?.find((u) => u.uuid === id);
      if (!user) {
        return `**Ошибка:** Пользователь с ID \`${id}\` не найден.`;
      }

      this.setActor(user.uuid, user.name);
      return `**Вход выполнен.** Активный пользователь: ${user.name} \`${user.uuid}\`\n\nВведите /app для возврата в меню.`;
    } catch {
      return `**Ошибка:** Не удалось проверить пользователя \`${id}\`.`;
    }
  }

  /**
   * Вход по Telegram ID.
   */
  private async loginByTelegramId(telegramId: string): Promise<string> {
    try {
      const response = await this.safeHandle(
        "/user/user/get-user-by-telegram-id",
      );
      const data = JSON.parse(response) as { uuid?: string; name?: string };

      if (!data.uuid) {
        return `**Ошибка:** Пользователь с Telegram ID \`${telegramId}\` не найден.`;
      }

      this.setActor(data.uuid, data.name);
      return `**Вход выполнен.** Активный пользователь: ${data.name ?? data.uuid} \`${data.uuid}\`\n\nВведите /app для возврата в меню.`;
    } catch {
      return `**Ошибка:** Пользователь с Telegram ID \`${telegramId}\` не найден.`;
    }
  }

  /**
   * Поиск по имени.
   * Если найдено ровно одно совпадение — входит. Иначе — показывает варианты.
   */
  private async loginByName(namePart: string): Promise<string> {
    const lowerPart = namePart.toLowerCase();

    try {
      const response = await this.safeHandle("/user/user/list-users");
      const data = JSON.parse(response) as {
        users?: Array<{ uuid: string; name: string }>;
      };

      if (!data.users || data.users.length === 0) {
        return `**Ошибка:** Пользователи с именем, содержащим \`${namePart}\`, не найдены.`;
      }

      const matches = data.users.filter((u) =>
        u.name.toLowerCase().includes(lowerPart),
      );

      if (matches.length === 0) {
        return `**Ошибка:** Пользователи с именем, содержащим \`${namePart}\`, не найдены.`;
      }

      if (matches.length === 1) {
        this.setActor(matches[0].uuid, matches[0].name);
        return `**Вход выполнен.** Активный пользователь: ${matches[0].name} \`${matches[0].uuid}\`\n\nВведите /app для возврата в меню.`;
      }

      // Несколько совпадений — показываем варианты
      let output = `**Найдено несколько пользователей** (по запросу \`${namePart}\`):\n\n`;
      for (const user of matches) {
        output += `- ${user.name}: \`/login ${user.uuid}\`\n`;
      }
      output += "\nВведите `/login <id>` для входа.";
      return output;
    } catch {
      return `**Ошибка:** Не удалось выполнить поиск по имени \`${namePart}\`.`;
    }
  }
}
