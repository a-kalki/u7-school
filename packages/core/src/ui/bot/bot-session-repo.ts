import type { BotSession } from './types';

/**
 * Порт хранилища сессий бота — персистентность «Диалога и Экрана»
 * (трек bot-ui-session-persist; архитектура §10.4, §12.3).
 *
 * Владеет двумя структурами:
 * - сессии пользователей (диалог + активный экран), ключ — telegramId чата;
 * - мапа сжатых id (`shortId → UUID`) — переживает рестарт, старые
 *   кнопки остаются нажимаемыми.
 *
 * Интерфейс без деталей хранилища (JSON-файл, БД — решает реализация).
 * Транспорт получает реализацию через конструктор; без неё работает
 * в in-memory-режиме (нынешнее поведение, тесты).
 */
export interface BotSessionRepo {
  /** Все сессии: telegramId → BotSession. */
  loadAll(): Promise<ReadonlyMap<number, BotSession>>;

  /** Сохраняет (создаёт или перезаписывает) сессию чата. */
  save(tgId: number, session: BotSession): Promise<void>;

  /** Удаляет сессию чата (отсутствующая — тихий no-op). */
  remove(tgId: number): Promise<void>;

  /** Вся мапа сжатых id: shortId-ключ (с суффиксом коллизии) → UUID. */
  loadShortIds(): Promise<ReadonlyMap<string, string>>;

  /** Добавляет запись сжатия (перезапись того же ключа — легальна). */
  saveShortId(key: string, value: string): Promise<void>;
}
