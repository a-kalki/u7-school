import type { GenericSchema, InferOutput } from "valibot";
import * as v from "valibot";

/**
 * Универсальный JSON-файловый репозиторий.
 * Хранит массив объектов в JSON-файле с валидацией через Valibot-схему.
 *
 * @typeParam T — тип хранимых объектов (выводится из схемы)
 */
export class JsonFileRepo<TSchema extends GenericSchema> {
  readonly #schema: TSchema;
  readonly #filePath: string;

  /**
   * @param schema — Valibot-схема для валидации каждого объекта
   * @param filePath — путь к JSON-файлу
   */
  constructor(schema: TSchema, filePath: string) {
    this.#schema = schema;
    this.#filePath = filePath;
  }

  /**
   * Читает все объекты из файла.
   * Невалидные объекты пропускаются с предупреждением в лог.
   * Отсутствующий или пустой файл → пустой массив.
   */
  async readAll(): Promise<InferOutput<TSchema>[]> {
    const file = Bun.file(this.#filePath);

    if (!(await file.exists())) {
      return [];
    }

    let raw: unknown;
    try {
      raw = await file.json();
    } catch {
      // Файл не является валидным JSON или пуст
      return [];
    }

    if (!Array.isArray(raw)) {
      return [];
    }

    const result: InferOutput<TSchema>[] = [];

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
  async writeAll(items: InferOutput<TSchema>[]): Promise<void> {
    await Bun.write(this.#filePath, JSON.stringify(items, null, 2));
  }
}
