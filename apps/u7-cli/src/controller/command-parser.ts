export type UIIntent =
  // Уровень приложения
  | { type: 'app'; command: 'about' } // для /, /app, /start, /about
  | { type: 'app'; command: 'modules' } // для /modules
  | { type: 'app'; command: 'quit' } // для /quit
  | { type: 'app'; command: 'register' } // для /register
  | { type: 'app'; command: 'login'; userId?: string } // для /login [userId]
  // Уровень модуля
  | { type: 'module'; moduleName: string; command: 'about' } // /<module>
  | { type: 'module'; moduleName: string; command: 'aggregates' } // /<module>/aggregates
  | {
      type: 'module';
      moduleName: string;
      aggregateName: string;
      command: 'usecases';
    } // /<module>/<aggregate>
  // Уровень UseCase
  | {
      type: 'usecase';
      moduleName: string;
      aggregateName: string;
      commandName: string;
      action: 'prompt';
    } // Запрос справки
  | {
      type: 'usecase';
      moduleName: string;
      aggregateName: string;
      commandName: string;
      action: 'execute';
      payload: string[];
    } // Выполнение с данными
  // Ошибки парсинга
  | { type: 'error'; message: string };

export class CommandParser {
  /**
   * Парсит ввод пользователя в объект намерения (UIIntent).
   * Поддерживает как однострочные команды, так и многострочный ввод для UseCase.
   *
   * @param text Текст от пользователя
   */
  parse(text: string): UIIntent {
    const lines = text
      .trim()
      .split('\n')
      .filter((line) => line.trim() !== '');
    if (lines.length === 0) {
      return { type: 'error', message: 'Пустой ввод' };
    }

    const commandLine = lines[0]?.trim() ?? '';

    // Глобальные команды
    if (['/', '/app', '/start', '/about'].includes(commandLine)) {
      return { type: 'app', command: 'about' };
    }
    if (commandLine === '/modules') {
      return { type: 'app', command: 'modules' };
    }
    if (commandLine === '/register') {
      return { type: 'app', command: 'register' };
    }
    if (commandLine.startsWith('/login')) {
      const parts = commandLine.split(/\s+/);
      const userId = parts[1] || undefined;
      return { type: 'app', command: 'login', userId };
    }
    if (commandLine === '/quit' || commandLine === '/exit') {
      return { type: 'app', command: 'quit' };
    }

    // Парсинг пути
    if (commandLine.startsWith('/')) {
      const parts = commandLine.split('/').filter(Boolean);

      // /<module>
      if (parts.length === 1) {
        return {
          type: 'module',
          moduleName: parts[0] as string,
          command: 'about',
        };
      }

      // /<module>/aggregates
      if (parts.length === 2 && parts[1] === 'aggregates') {
        return {
          type: 'module',
          moduleName: parts[0] as string,
          command: 'aggregates',
        };
      }

      // /<module>/<aggregate>
      if (parts.length === 2) {
        return {
          type: 'module',
          moduleName: parts[0] as string,
          aggregateName: parts[1] as string,
          command: 'usecases',
        };
      }

      // /<module>/<aggregate>/<command>
      if (parts.length === 3) {
        const moduleName = parts[0] as string;
        const aggregateName = parts[1] as string;
        const commandName = parts[2] as string;

        if (lines.length === 1) {
          // Только путь - запрос справки (prompt)
          return {
            type: 'usecase',
            moduleName,
            aggregateName,
            commandName,
            action: 'prompt',
          };
        } else {
          // Есть payload - собираем параметры, начинающиеся с дефиса
          const payload = lines.slice(1).map((line) => {
            const trimmed = line.trim();
            // Поддерживаем списки "- значение" или "* значение"
            if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
              return trimmed.substring(1).trim();
            }
            return trimmed;
          });
          return {
            type: 'usecase',
            moduleName,
            aggregateName,
            commandName,
            action: 'execute',
            payload,
          };
        }
      }
    }

    return {
      type: 'error',
      message:
        'Неизвестная команда. Введите путь из меню или /app для возврата в главное меню.',
    };
  }
}
