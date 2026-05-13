import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import * as v from "valibot";
import { JsonFileRepo, JsonFileRepoError } from "./json-file-repo";

// Тестовая схема для проверки валидации
const ItemSchema = v.object({
	id: v.string(),
	name: v.pipe(v.string(), v.nonEmpty("Имя не может быть пустым")),
});

type Item = v.InferOutput<typeof ItemSchema>;

// Временная директория для тестовых файлов
const TEST_DIR = "/tmp/json-file-repo-tests";

const testFile = (name: string) => `${TEST_DIR}/${name}`;

describe("JsonFileRepo", () => {
	beforeEach(async () => {
		// Очищаем тестовую директорию
		await Bun.$`rm -rf ${TEST_DIR}`;
		await Bun.$`mkdir -p ${TEST_DIR}`;
	});

	afterEach(async () => {
		await Bun.$`rm -rf ${TEST_DIR}`;
	});

	describe("readAll + writeAll", () => {
		test("записывает и читает массив объектов", async () => {
			const repo = new JsonFileRepo(ItemSchema, testFile("data.json"));
			const items: Item[] = [
				{ id: "1", name: "Первый" },
				{ id: "2", name: "Второй" },
			];

			await repo.writeAll(items);
			const result = await repo.readAll();

			expect(result).toEqual(items);
		});

		test("возвращает пустой массив для отсутствующего файла", async () => {
			const repo = new JsonFileRepo(ItemSchema, testFile("nonexistent.json"));

			const result = await repo.readAll();

			expect(result).toEqual([]);
		});

		test("выбрасывает JsonFileRepoError для пустого файла", async () => {
			const filePath = testFile("empty.json");
			await Bun.write(filePath, "");
			const repo = new JsonFileRepo(ItemSchema, filePath);

			await expect(repo.readAll()).rejects.toThrow(JsonFileRepoError);
		});

		test("сохранение полностью перезаписывает файл", async () => {
			const repo = new JsonFileRepo(ItemSchema, testFile("data.json"));
			const initial: Item[] = [
				{ id: "1", name: "Первый" },
				{ id: "2", name: "Второй" },
				{ id: "3", name: "Третий" },
			];

			await repo.writeAll(initial);

			const updated: Item[] = [{ id: "4", name: "Четвёртый" }];
			await repo.writeAll(updated);

			const result = await repo.readAll();
			expect(result).toEqual(updated);
		});
	});

	describe("валидация", () => {
		test("фильтрует невалидные объекты при чтении", async () => {
			const filePath = testFile("mixed.json");
			// Записываем сырой JSON с валидными и невалидными объектами
			const raw = [
				{ id: "1", name: "Валидный" },
				{ id: "2", name: "" }, // невалидный — пустое имя
				{ id: "3" }, // невалидный — нет name
				{ id: "4", name: "Ещё валидный" },
			];
			await Bun.write(filePath, JSON.stringify(raw, null, 2));

			const repo = new JsonFileRepo(ItemSchema, filePath);
			const result = await repo.readAll();

			expect(result).toHaveLength(2);
			expect(result).toEqual([
				{ id: "1", name: "Валидный" },
				{ id: "4", name: "Ещё валидный" },
			]);
		});

		test("возвращает пустой массив если все объекты невалидны", async () => {
			const filePath = testFile("all-invalid.json");
			const raw = [
				{ id: "1" }, // нет name
				{ name: "Без id" }, // нет id
			];
			await Bun.write(filePath, JSON.stringify(raw, null, 2));

			const repo = new JsonFileRepo(ItemSchema, filePath);
			const result = await repo.readAll();

			expect(result).toEqual([]);
		});

		test("не-массив в JSON выбрасывает JsonFileRepoError", async () => {
			const filePath = testFile("not-array.json");
			await Bun.write(
				filePath,
				JSON.stringify({ id: "1", name: "Один" }, null, 2),
			);

			const repo = new JsonFileRepo(ItemSchema, filePath);

			await expect(repo.readAll()).rejects.toThrow(JsonFileRepoError);
		});

		test("битый JSON выбрасывает JsonFileRepoError", async () => {
			const filePath = testFile("broken.json");
			await Bun.write(filePath, "{not valid json");

			const repo = new JsonFileRepo(ItemSchema, filePath);

			await expect(repo.readAll()).rejects.toThrow(JsonFileRepoError);
		});
	});
});
