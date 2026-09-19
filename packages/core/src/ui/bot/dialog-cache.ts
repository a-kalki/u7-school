import type { BotSession } from './types';

/**
 * Системный эпохальный кеш стори: вспомогательные данные диалога
 * (страницы пагинатора и т.п.), живущие ДО смены диалога.
 *
 * НЕ персистная `BotSession` (json-репо сериализует сессию на каждом
 * апдейте и переживает рестарт — вспомогательным данным это не нужно):
 * чистая память процесса, умирает с ним. Смена диалога — физический
 * `drop(tgId)` в `enterDialog` ядра; обходной проактив-якорь не ломает —
 * `get` дополнительно сверяет эпоху записи (path+seq): чужая эпоха —
 * miss, стори тихо пересобирает данные.
 */
export class DialogCache {
  /** Запись: данные + эпоха диалога, в которой они собраны. */
  #entries = new Map<
    number,
    Map<string, { epoch: { path: string; seq: number }; data: unknown }>
  >();

  /**
   * Записывает данные по (пользователь, ключ) с эпохой текущего диалога.
   * Без открытого диалога — тихий no-op (до /start кешу нечего хранить).
   */
  set(tgId: number, key: string, data: unknown, session: BotSession): void {
    const epoch = session.dialog;
    if (!epoch) return;

    let userEntries = this.#entries.get(tgId);
    if (!userEntries) {
      userEntries = new Map();
      this.#entries.set(tgId, userEntries);
    }
    userEntries.set(key, { epoch: { path: epoch.path, seq: epoch.seq }, data });
  }

  /**
   * Читает данные по (пользователь, ключ). Miss (undefined) — ключ не
   * записан ИЛИ записан в другой эпохе (path+seq не совпали) — вызывающая
   * стори пересобирает данные.
   */
  get<T = unknown>(
    tgId: number,
    key: string,
    session: BotSession,
  ): T | undefined {
    const epoch = session.dialog;
    if (!epoch) return undefined;

    const entry = this.#entries.get(tgId)?.get(key);
    if (!entry) return undefined;
    if (entry.epoch.path !== epoch.path || entry.epoch.seq !== epoch.seq) {
      return undefined;
    }
    return entry.data as T;
  }

  /**
   * Физический сброс всех записей пользователя — вызывается ядром в
   * `enterDialog` при переходе в новую эпоху диалога (только у текущего
   * пользователя; мусор не копится: смена диалога — drop).
   */
  drop(tgId: number): void {
    this.#entries.delete(tgId);
  }
}
