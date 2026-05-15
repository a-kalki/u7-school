import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * Простой JSON-file storage adapter для Grammy session.
 */
export class JsonSessionStorage<T> {
  readonly #filePath: string;

  constructor(filePath: string) {
    this.#filePath = filePath;
  }

  async read(key: string): Promise<T | undefined> {
    if (!existsSync(this.#filePath)) {
      return undefined;
    }
    try {
      const content = readFileSync(this.#filePath, 'utf-8');
      const data = JSON.parse(content) as Record<string, T>;
      return data[key];
    } catch {
      return undefined;
    }
  }

  async write(key: string, value: T): Promise<void> {
    let data: Record<string, T> = {};
    if (existsSync(this.#filePath)) {
      try {
        const content = readFileSync(this.#filePath, 'utf-8');
        data = JSON.parse(content) as Record<string, T>;
      } catch {
        data = {};
      }
    }
    data[key] = value;
    writeFileSync(this.#filePath, JSON.stringify(data, null, 2));
  }

  async delete(key: string): Promise<void> {
    if (!existsSync(this.#filePath)) {
      return;
    }
    try {
      const content = readFileSync(this.#filePath, 'utf-8');
      const data = JSON.parse(content) as Record<string, T>;
      delete data[key];
      writeFileSync(this.#filePath, JSON.stringify(data, null, 2));
    } catch {
      // ignore
    }
  }
}
