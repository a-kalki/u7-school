/**
 * База данных на JSON-файлах с поддержкой транзакций.
 * Один экземпляр на модуль. При создании получает все Repo.
 *
 * Использование:
 *   const db = new BaseJsonDb();
 *   db.begin();
 *   // ... работа с репозиториями ...
 *   await db.commit();  // или db.rollback() при ошибке
 */
export class BaseJsonDb {
  /** Кеш: коллекция → массив объектов */
  #cache = new Map<string, unknown[]>();
  /** Внутри транзакции? */
  #inTransaction = false;
  /** Зарегистрированные коллекции: имя → путь к файлу */
  #collections = new Map<string, string>();

  /**
   * Регистрирует коллекцию (вызывается JsonFileRepo при создании).
   */
  registerCollection(name: string, filePath: string): void {
    this.#collections.set(name, filePath);
  }

  /**
   * Начинает транзакцию.
   */
  begin(): void {
    if (this.#inTransaction) {
      throw new Error("Транзакция уже начата");
    }
    this.#inTransaction = true;
    this.#cache.clear();
  }

  /**
   * Фиксирует транзакцию: записывает все изменения на диск.
   */
  async commit(): Promise<void> {
    if (!this.#inTransaction) {
      throw new Error("Нет активной транзакции");
    }

    try {
      for (const [name, filePath] of this.#collections) {
        const items = this.#cache.get(name);
        if (items !== undefined) {
          await Bun.write(filePath, JSON.stringify(items, null, 2));
        }
      }
    } finally {
      this.#inTransaction = false;
      this.#cache.clear();
    }
  }

  /**
   * Откатывает транзакцию: сбрасывает кеш без записи на диск.
   */
  rollback(): void {
    if (!this.#inTransaction) {
      throw new Error("Нет активной транзакции");
    }
    this.#inTransaction = false;
    this.#cache.clear();
  }

  /**
   * Читает коллекцию из кеша (если в транзакции) или с диска.
   */
  async readCollection<T>(name: string, filePath: string): Promise<T[]> {
    if (this.#inTransaction) {
      const cached = this.#cache.get(name);
      if (cached !== undefined) {
        return cached as T[];
      }

      // Первое чтение в транзакции — загружаем с диска
      const items = await this.#loadFromDisk<T>(filePath);
      this.#cache.set(name, items);
      return items;
    }

    return this.#loadFromDisk<T>(filePath);
  }

  /**
   * Записывает коллекцию в кеш (если в транзакции) или на диск.
   */
  async writeCollection<T>(name: string, filePath: string, items: T[]): Promise<void> {
    if (this.#inTransaction) {
      this.#cache.set(name, items);
      return;
    }

    await Bun.write(filePath, JSON.stringify(items, null, 2));
  }

  /**
   * Загружает данные с диска.
   */
  async #loadFromDisk<T>(filePath: string): Promise<T[]> {
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      return [];
    }
    try {
      const raw = await file.json();
      if (Array.isArray(raw)) {
        return raw as T[];
      }
      return [];
    } catch {
      return [];
    }
  }
}
