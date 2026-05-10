import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { AutoUiCliController } from "@u7/core/ui";

/**
 * Контроллер CLI для модуля курсов.
 */
export class CourseCliController extends AutoUiCliController {
  createReadline(): readline.Interface {
    return readline.createInterface({ input, output });
  }

  writePrompt(): void {
    process.stdout.write("\n> ");
  }

  handleQuit(): void {
    console.log("До свидания!");
  }

  async handleRegister(): Promise<string> {
    return "Регистрация выполняется через модуль пользователей (/user/user/create-user)";
  }

  async handleLogin(_args?: string): Promise<string> {
    return "Вход выполняется через модуль пользователей (/login)";
  }

  async renderMenu(): Promise<string> {
    let menu = "\n\n---\n**Меню курсов:**\n";

    try {
      const result = await this.app.callUseCase("course", "list-courses", {});
      const data = result as { courses?: Array<{ uuid: string; title: string; kind: string }> };
      if (data.courses && data.courses.length > 0) {
        menu += "\n**Список курсов:**\n";
        for (const course of data.courses) {
          menu += `- [${course.kind}] ${course.title}: \`/course/course/get-course uuid: ${course.uuid}\`\n`;
        }
      } else {
        menu += "\nКурсы не найдены.\n";
      }
    } catch {
      menu += "\nНе удалось загрузить список курсов.\n";
    }

    menu += "\n- Создать курс: `/course/course/create-course`\n";
    menu += "- Создать урок: `/course/course/create-lesson`\n";
    menu += "- Создать шаг: `/course/course/create-step`\n";
    menu += "- Создать файл: `/course/course/create-file-metadata`\n";
    return menu;
  }
}
