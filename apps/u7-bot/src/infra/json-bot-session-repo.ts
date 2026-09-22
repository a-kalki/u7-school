import { JsonFileRepo } from '@u7-scl/core/infra';
import type { BotSession, BotSessionRepo } from '@u7-scl/core/ui';
import * as v from 'valibot';

/**
 * JSON-файловая реализация порта BotSessionRepo (трек
 * bot-ui-session-persist): сессии переживают рестарт сервиса,
 * shortId-маппинг — старые кнопки остаются нажимаемыми.
 *
 * Две коллекции (по файлу на коллекцию, JsonFileRepo):
 * - сессии: [{ tgId, session }] — ключ чата, полная перезапись;
 * - shortId-маппинг: [{ key, uuid }] — ключ с суффиксом коллизии.
 *
 * Повреждение файла (битый JSON) — fail-fast: JsonFileRepoError
 * пробрасывается наверх (старт падает с явной ошибкой, молчаливых
 * пересозданий нет). Невалидные отдельные записи пропускаются
 * с warn-логом и бэкапом (поведение JsonFileRepo).
 */

// ── Схемы (зеркала типов контракта «Диалог и Экран», core/ui) ──

/** KeyboardDescription — inline-клавиатура (url — опционально). */
const KeyboardSchema = v.object({
  rows: v.array(
    v.array(
      v.object({
        text: v.string(),
        code: v.string(),
        url: v.optional(v.string()),
      }),
    ),
  ),
  isMultiple: v.boolean(),
});

/** ScreenState — активный экран (messageId обязателен). */
const ScreenStateSchema = v.object({
  messageId: v.number(),
  ownerSeq: v.number(),
  text: v.string(),
  keyboard: v.optional(KeyboardSchema),
});

/** DialogState — диалог (path/seq) с опциональным ожиданием ввода. */
const DialogStateSchema = v.object({
  path: v.string(),
  seq: v.number(),
  input: v.optional(v.object({ context: v.optional(v.unknown()) })),
});

/** BotSession — сессия чата. */
const BotSessionSchema = v.object({
  dialog: v.optional(DialogStateSchema),
  screen: v.optional(ScreenStateSchema),
});

/** Запись сессии в коллекции: ключ чата + сессия. */
const SessionRecordSchema = v.object({
  tgId: v.number(),
  session: BotSessionSchema,
});

/** Запись сжатия: shortId-ключ (с суффиксом коллизии) → UUID. */
const ShortIdRecordSchema = v.object({
  key: v.string(),
  uuid: v.string(),
});

type SessionRecord = v.InferOutput<typeof SessionRecordSchema>;
type ShortIdRecord = v.InferOutput<typeof ShortIdRecordSchema>;

// ── Реализация ──

export class JsonBotSessionRepo implements BotSessionRepo {
  readonly #sessions: JsonFileRepo<SessionRecord>;
  readonly #shortIds: JsonFileRepo<ShortIdRecord>;

  /**
   * @param sessionsFilePath — путь к JSON-файлу сессий
   * @param shortIdsFilePath — путь к JSON-файлу shortId-маппинга
   */
  constructor(sessionsFilePath: string, shortIdsFilePath: string) {
    this.#sessions = new JsonFileRepo<SessionRecord>(
      SessionRecordSchema,
      sessionsFilePath,
    );
    this.#shortIds = new JsonFileRepo<ShortIdRecord>(
      ShortIdRecordSchema,
      shortIdsFilePath,
    );
  }

  async loadAll(): Promise<ReadonlyMap<number, BotSession>> {
    const records = await this.#sessions.readAll();
    return new Map(records.map((r) => [r.tgId, r.session]));
  }

  async save(tgId: number, session: BotSession): Promise<void> {
    const records = await this.#sessions.readAll();
    const record: SessionRecord = { tgId, session };
    const idx = records.findIndex((r) => r.tgId === tgId);
    if (idx !== -1) {
      records[idx] = record;
    } else {
      records.push(record);
    }
    await this.#sessions.writeAll(records);
  }

  async remove(tgId: number): Promise<void> {
    const records = await this.#sessions.readAll();
    const filtered = records.filter((r) => r.tgId !== tgId);
    // Нет изменений — нет записи на диск (лишний rewrite не нужен).
    if (filtered.length === records.length) return;
    await this.#sessions.writeAll(filtered);
  }

  async loadShortIds(): Promise<ReadonlyMap<string, string>> {
    const records = await this.#shortIds.readAll();
    return new Map(records.map((r) => [r.key, r.uuid]));
  }

  async saveShortId(key: string, value: string): Promise<void> {
    const records = await this.#shortIds.readAll();
    const record: ShortIdRecord = { key, uuid: value };
    const idx = records.findIndex((r) => r.key === key);
    if (idx !== -1) {
      records[idx] = record;
    } else {
      records.push(record);
    }
    await this.#shortIds.writeAll(records);
  }
}
