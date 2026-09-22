import type { Api, Composer } from 'grammy';
import type { BotContext } from '../src/context';

/**
 * Dev-режим «театр одного актёра»: подмена личности на входе транспорта.
 *
 * Живёт в scripts/ (не в src-пути прод-бандла): main.ts подгружает модуль
 * динамически и только при DEV_TELEGRAM_ID вне production — прод-путь кода
 * подмены не содержит.
 *
 * Фикстуры моделируют виртуальный мир (потоки, студенты, менторы).
 * Ручная проверка всех ролей без второго аккаунта: апдейты с
 * DEV_TELEGRAM_ID получают from.id текущей персоны — домен видит
 * фикстурного пользователя; сессии персон раздельные (ключ — telegramId).
 * Исходящие проактивы персонам (приглашения кампаний и т.п.) редиректятся
 * в dev-чат, поэтому сквозные сценарии видны в одном окне чата:
 * ментор завершил студента → приглашение студенту прилетело тебе →
 * переключился на студента → написал отзыв.
 *
 * Переключение — командой /persona <ключ> прямо в чате, без рестарта.
 * Команда обрабатывается до транспорта и в домен не уходит.
 */

export interface DevPersona {
  /** Ключ команды: /persona andrey. */
  key: string;
  /** Имя в фикстурном мире (users.json). */
  name: string;
  /** Роль в мире — для списка и лога. */
  about: string;
  /** Фикстурный telegramId (подставляется в from.id). */
  telegramId: number;
}

/** Персонажи dev-мира (users.json фикстур). Порядок = персона по умолчанию. */
export const DEV_PERSONAS: readonly DevPersona[] = [
  {
    key: 'dev',
    name: 'Dev',
    about: 'ментор Потока 2 и остальных потоков JS Core',
    telegramId: 1004,
  },
  {
    key: 'andrey',
    name: 'Андрей',
    about: 'студент Потока 2 (active), субъект живой кампании отзывов',
    telegramId: 1003,
  },
  {
    key: 'marina',
    name: 'Марина',
    about: 'студент Потока 2 (advanced), одногруппница',
    telegramId: 1007,
  },
  {
    key: 'oleg',
    name: 'Олег',
    about: 'студент Потока 2 (not_advanced), одногруппник',
    telegramId: 1008,
  },
];

/** Переключатель персон: входящая подмена + исходящий редирект. */
export class DevPersonaSwitch {
  #current: DevPersona;
  /** Фикстурные tg персон → dev-чат (исходящий редирект). */
  readonly redirects: ReadonlyMap<number, number>;

  constructor(readonly devTelegramId: number) {
    const first = DEV_PERSONAS[0];
    if (!first) throw new Error('DEV_PERSONAS пуст — некому подменять');
    this.#current = first;
    this.redirects = new Map(
      DEV_PERSONAS.map((p) => [p.telegramId, devTelegramId]),
    );
  }

  get current(): DevPersona {
    return this.#current;
  }

  /** Список персон (текущая роль + все ключи) — для лога и чата. */
  listText(): string {
    const lines = DEV_PERSONAS.map(
      (p) => `• /persona ${p.key} — ${p.name}: ${p.about}`,
    );
    return `Текущая роль: ${this.#current.name} (${this.#current.about})\n${lines.join('\n')}`;
  }

  /**
   * /persona [ключ] — переключение роли; без аргумента — список.
   * null — текст не команда: пропустить в обычную обработку.
   */
  handleCommand(text: string): string | null {
    const trimmed = text.trim();
    if (trimmed !== '/persona' && !trimmed.startsWith('/persona ')) {
      return null;
    }
    const key = trimmed.split(/\s+/)[1];
    if (!key) return this.listText();
    const found = DEV_PERSONAS.find((p) => p.key === key);
    if (!found) return `Не знаю роль «${key}».\n\n${this.listText()}`;
    this.#current = found;
    return `🎭 Теперь ты — ${found.name}: ${found.about}.\nВсе следующие сообщения — от его имени.`;
  }

  /** Подменить автора апдейта на текущую персону (вход в транспорт). */
  applyFrom(ctx: BotContext): void {
    if (ctx.from?.id === this.devTelegramId) {
      ctx.from.id = this.#current.telegramId;
    }
  }

  /**
   * Обёртка BotApi: sendMessage фикстурным персонам уходит в dev-чат.
   * Прочие вызовы (группы, реальные пользователи) — без изменений.
   */
  wrapApi(api: Api): Api {
    const redirects = this.redirects;
    return new Proxy(api, {
      get(target, prop) {
        if (prop === 'sendMessage') {
          const send = target.sendMessage.bind(target);
          return (chatId: number | string, text: string, other?: object) =>
            send(
              typeof chatId === 'number'
                ? (redirects.get(chatId) ?? chatId)
                : chatId,
              text,
              other,
            );
        }
        const value = Reflect.get(target, prop, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  }
}

/** Панель dev-режима — контракт точки подключения в main.ts. */
export interface DevPersonaPanel {
  /** Список персон (текущая роль + ключи) — для лога и приветствия. */
  listText(): string;
  /** Обёртка BotApi с редиректом проактивов персонам в dev-чат. */
  wrapApi(api: Api): Api;
  /** Перехватчик /persona + подмена автора ДО транспорта. */
  installCommandInterceptor(bot: Composer<BotContext>): void;
}

/**
 * Точка входа dev-режима для main.ts: собирает переключатель персон
 * и всё, что нужно прод-скрипту для подключения (динамический импорт).
 */
export function createDevPersonaPanel(devTelegramId: number): DevPersonaPanel {
  const sw = new DevPersonaSwitch(devTelegramId);
  return {
    listText: () => sw.listText(),
    wrapApi: (api) => sw.wrapApi(api),
    installCommandInterceptor(bot) {
      // Ответы команды — в реальный dev-чат (chat.id не подменяется);
      // прочие пользователи — без изменений.
      bot.use(async (ctx, next) => {
        if (ctx.from?.id !== devTelegramId) return next();
        const text = ctx.message?.text;
        if (text) {
          const reply = sw.handleCommand(text);
          if (reply !== null) {
            await ctx.reply(reply);
            return;
          }
        }
        sw.applyFrom(ctx);
        return next();
      });
    },
  };
}
