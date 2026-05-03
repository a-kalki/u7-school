import { describe, expect, test } from "bun:test";
import { Role } from "../domain/user/roles";
import type { User } from "../domain/user/user";
import { InMemoryCourseRepository } from "./course/course_repository";
import { CoreModule } from "./module";
import { InMemoryUserRepository } from "./user/user_repository";

describe("Интеграционный тест: полный сценарий", () => {
	test("create-user (bootstrap) → create-course", async () => {
		const userRepo = new InMemoryUserRepository();
		const courseRepo = new InMemoryCourseRepository();
		const m = new CoreModule({ userRepo, courseRepo });

		// Bootstrap: первый пользователь — ADMIN
		const r1 = await m.handle({
			name: "create-user",
			attrs: { name: "Админ", telegramId: 1, role: Role.ADMIN },
		});
		const admin = r1 as User;
		expect(admin.role).toBe(Role.ADMIN);

		// Создаём MENTOR
		const r2 = await m.handle({
			name: "create-user",
			user: admin.uuid,
			attrs: { name: "Ментор", telegramId: 2, role: Role.MENTOR },
		});
		const mentor = r2 as User;
		expect(mentor.role).toBe(Role.MENTOR);

		// MENTOR создаёт курс
		const r3 = await m.handle({
			name: "create-course",
			user: mentor.uuid,
			attrs: { title: "Мат", description: "Курс", authorId: mentor.uuid },
		});
		expect((r3 as { title: string }).title).toBe("Мат");
	});

	test("полный сценарий через ConsoleController", async () => {
		const { ConsoleController } = await import("./controllers/console/run");
		const ctrl = new ConsoleController();

		const adminR = await ctrl.run([
			"create-user",
			"--name=А",
			"--telegram-id=1",
		]);
		const adminId = JSON.parse(adminR).uuid;

		const mentorR = await ctrl.run([
			"create-user",
			"--name=М",
			"--telegram-id=2",
			"--role=MENTOR",
			`--actor-id=${adminId}`,
		]);
		const mentorId = JSON.parse(mentorR).uuid;

		const courseR = await ctrl.run([
			"create-course",
			"--title=К",
			"--description=Д",
			`--author-id=${mentorId}`,
			`--actor-id=${mentorId}`,
		]);
		expect(JSON.parse(courseR).title).toBe("К");
	});
});
