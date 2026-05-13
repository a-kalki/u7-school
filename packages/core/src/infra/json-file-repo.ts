import type { GenericSchema } from "valibot";
import * as v from "valibot";
import { BaseJsonDb } from "./base-json-db";

/**
 * Ошибка, возникающая при повреждении структуры JSON-файла.
 * Выбрасывается, чтобы предотвратить потерю данных (например,
 * когда битый файл мог бы быть перезаписан seed-данными).
 */
export class JsonFileRepoError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
  ) {
    super(`[JsonFileRepo] ${filePath}: ${message}`);
    this.name = "JsonFileRepoError";
  }
}

/**
 * Универсальный JSON-файловый репозиторий.
 * Хранит массив объектов в JSON-файле с валидацией через Valibot-схему.
 *
 * @typeParam T — DTO-тип хранимых объектов
 */
export class JsonFileRepo<T> {
  readonly #schema: GenericSchema<T>;
  readonly #filePath: string;
  readonly #db?: BaseJsonDb;
  readonly #collectionName: string;

  /** Путь к JSON-файлу */
  get filePath(): string {
    return this.#filePath;
  }

  /**
   * @param schema — Valibot-схема для валидации каждого объекта
   * @param filePath — путь к JSON-файлу
   * @param db — опционально: экземпляр BaseJsonDb для транзакционной поддержки
   * @param collectionName — имя коллекции (обязательно при передаче db)
   */
  constructor(
    schema: GenericSchema<T>,
    filePath: string,
    db?: BaseJsonDb,
    collectionName?: string,
  ) {
    this.#schema = schema;
    this.#filePath = filePath;
    this.#db = db;
    this.#collectionName = collectionName ?? filePath;

    if (db) {
      db.registerCollection(this.#collectionName, filePath);
    }
  }

  /**
   * Читает все объекты из файла.
   * - Отсутствующий файл → пустой массив
   * - Невалидный JSON или не-массив → выбрасывает JsonFileRepoError
   * - Отдельные невалидные объекты пропускаются с console.warn
   */
  async readAll(): Promise<T[]> {
    let raw: unknown[];

    if (this.#db) {
      raw = (await this.#db.readCollection(this.#collectionName, this.#filePath)) as unknown[];
    } else {
      const file = Bun.file(this.#filePath);

      if (!(await file.exists())) {
        return [];
      }

      try {
        raw = await file.json();
      } catch (cause) {
        throw new JsonFileRepoError(
          `Не удалось распарсить JSON: ${cause instanceof Error ? cause.message : String(cause)}`,
          this.#filePath,
        );
      }

      if (!Array.isArray(raw)) {
        throw new JsonFileRepoError(
          `Ожидался JSON-массив, получен ${typeof raw}`,
          this.#filePath,
        );
      }
    }

    const result: T[] = [];

    for (const item of raw) {
      const parsed = v.safeParse(this.#schema, item);
      if (parsed.success) {
        result.push(parsed.output);
      } else {
        console.warn(
          `[JsonFileRepo] Пропущена невалидная запись в файле ${this.#filePath}:`,
          v.flatten(parsed.issues),
        );
      }
    }

    return result;
  }

  /**
   * Записывает массив объектов в файл (полная перезапись).
   */
  async writeAll(items: T[]): Promise<void> {
    if (this.#db) {
      await this.#db.writeCollection(this.#collectionName, this.#filePath, items);
    } else {
      await Bun.write(this.#filePath, JSON.stringify(items, null, 2));
    }
  }
}
