import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { BaseJsonDb } from "./base-json-db";

const tmpDir = mkdtempSync("/tmp/base-json-db-test-");

describe("BaseJsonDb", () => {
  test("begin → commit сохраняет изменения в обоих файлах", async () => {
    const fileA = join(tmpDir, "coll-a.json");
    const fileB = join(tmpDir, "coll-b.json");

    const db = new BaseJsonDb();
    db.registerCollection("a", fileA);
    db.registerCollection("b", fileB);

    db.begin();
    await db.writeCollection("a", fileA, [{ id: 1 }]);
    await db.writeCollection("b", fileB, [{ id: 2 }]);
    await db.commit();

    const contentA = readFileSync(fileA, "utf-8");
    const contentB = readFileSync(fileB, "utf-8");
    expect(JSON.parse(contentA)).toEqual([{ id: 1 }]);
    expect(JSON.parse(contentB)).toEqual([{ id: 2 }]);

    rmSync(fileA, { force: true });
    rmSync(fileB, { force: true });
  });

  test("begin → rollback не изменяет файлы", async () => {
    const fileA = join(tmpDir, "rollback-a.json");
    const fileB = join(tmpDir, "rollback-b.json");

    // Предзаписываем файлы
    await Bun.write(fileA, JSON.stringify([{ id: 0 }]));
    await Bun.write(fileB, JSON.stringify([{ id: 0 }]));

    const db = new BaseJsonDb();
    db.registerCollection("a", fileA);
    db.registerCollection("b", fileB);

    db.begin();
    await db.writeCollection("a", fileA, [{ id: 1 }]);
    await db.writeCollection("b", fileB, [{ id: 2 }]);
    db.rollback();

    const contentA = readFileSync(fileA, "utf-8");
    const contentB = readFileSync(fileB, "utf-8");
    expect(JSON.parse(contentA)).toEqual([{ id: 0 }]);
    expect(JSON.parse(contentB)).toEqual([{ id: 0 }]);

    rmSync(fileA, { force: true });
    rmSync(fileB, { force: true });
  });

  test("commit без begin выбрасывает ошибку", () => {
    const db = new BaseJsonDb();
    expect(db.commit()).rejects.toThrow("Нет активной транзакции");
  });

  test("rollback без begin выбрасывает ошибку", () => {
    const db = new BaseJsonDb();
    expect(() => db.rollback()).toThrow("Нет активной транзакции");
  });

  test("begin внутри begin выбрасывает ошибку", () => {
    const db = new BaseJsonDb();
    db.begin();
    expect(() => db.begin()).toThrow("Транзакция уже начата");
    db.rollback();
  });
});

// Очистка после всех тестов
afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});
