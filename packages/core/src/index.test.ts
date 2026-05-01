import { describe, test, expect } from "bun:test";

// Проверка, что пакет @u7/core инициализирован и доступен для импорта
describe("Инициализация пакета @u7/core", () => {
  test("пакет должен экспортироваться и быть доступным для импорта", async () => {
    // Импорт точки входа пакета
    const mod = await import("./index");
    expect(mod).toBeDefined();
  });

  test("пакет должен иметь доступ к valibot", async () => {
    // Проверка, что зависимость valibot доступна
    const valibot = await import("valibot");
    expect(valibot).toBeDefined();
    expect(typeof valibot.object).toBe("function");
  });
});
