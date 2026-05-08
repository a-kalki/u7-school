import type { GenericSchema } from "valibot";
import * as v from "valibot";

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

  /**
   * @param schema — Valibot-схема для валидации каждого объекта
   * @param filePath — путь к JSON-файлу
   */
  constructor(schema: GenericSchema<T>, filePath: string) {
    this.#schema = schema;
    this.#filePath = filePath;
  }

  /**
   * Читает все объекты из файла.
   * - Отсутствующий файл → пустой массив
   * - Невалидный JSON или не-массив → выбрасывает JsonFileRepoError
   * - Отдельные невалидные объекты пропускаются с console.warn
   */
  async readAll(): Promise<T[]> {
    const file = Bun.file(this.#filePath);

    if (!(await file.exists())) {
      return [];
    }

    let raw: unknown;
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
    await Bun.write(this.#filePath, JSON.stringify(items, null, 2));
  }
}
