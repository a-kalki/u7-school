import { describe, expect, test } from "bun:test";
import { ConsoleController } from "./run";

describe("Консольный интерфейс", () => {
	test("create-user: bootstrap создаёт ADMIN, выводит JSON", async () => {
		const ctrl = new ConsoleController();
		const result = await ctrl.run([
			"create-user",
			"--name=Иван",
			"--telegram-id=1",
		]);
		const parsed = JSON.parse(result);
		expect(parsed.role).toBe("ADMIN");
		expect(parsed.name).toBe("Иван");
	});

	test("create-user: STUDENT не создаётся без actorId", async () => {
		const ctrl = new ConsoleController();
		await expect(
			ctrl.run([
				"create-user",
				"--name=X",
				"--telegram-id=2",
				"--role=STUDENT",
			]),
		).rejects.toThrow("Первый пользователь должен быть администратором");
	});

	test("create-course: MENTOR создаёт курс", async () => {
		const ctrl = new ConsoleController();
		// bootstrap: первый пользователь — ADMIN
		const adminResult = await ctrl.run([
			"create-user",
			"--name=Админ",
			"--telegram-id=10",
		]);
		const adminId = JSON.parse(adminResult).uuid;
		// второй пользователь — MENTOR (с actorId=admin)
		const mentorResult = await ctrl.run([
			"create-user",
			"--name=Ментор",
			"--telegram-id=20",
			"--role=MENTOR",
			`--actor-id=${adminId}`,
		]);
		const mentorId = JSON.parse(mentorResult).uuid;
		const result = await ctrl.run([
			"create-course",
			"--title=Математика",
			"--description=Курс",
			`--author-id=${mentorId}`,
			`--actor-id=${mentorId}`,
		]);
		expect(JSON.parse(result).title).toBe("Математика");
	});

	test("неизвестная команда — ошибка", async () => {
		const ctrl = new ConsoleController();
		await expect(ctrl.run(["unknown"])).rejects.toThrow("Неизвестная команда");
	});
});
