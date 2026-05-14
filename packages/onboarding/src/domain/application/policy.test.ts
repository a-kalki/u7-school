import { describe, expect, test } from "bun:test";
import type { User } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import type { Application } from "./entity";
import { Experience } from "./experience";
import { Format } from "./format";
import { Goals } from "./goals";
import { Intensity } from "./intensity";
import { ApplicationPolicy } from "./policy";
import { Source } from "./source";
import { ApplicationStatus } from "./status";

describe("ApplicationPolicy", () => {
	const owner: User = {
		uuid: "550e8400-e29b-41d4-a716-446655440001",
		name: "Владелец",
		telegramId: 1,
		roles: [Role.GUEST],
		createdAt: "2024-01-01T00:00",
	};

	const admin: User = {
		uuid: "550e8400-e29b-41d4-a716-446655440002",
		name: "Админ",
		telegramId: 2,
		roles: [Role.ADMIN],
		createdAt: "2024-01-01T00:00",
	};

	const mentor: User = {
		uuid: "550e8400-e29b-41d4-a716-446655440003",
		name: "Ментор",
		telegramId: 3,
		roles: [Role.MENTOR],
		createdAt: "2024-01-01T00:00",
	};

	const stranger: User = {
		uuid: "550e8400-e29b-41d4-a716-446655440004",
		name: "Чужак",
		telegramId: 4,
		roles: [Role.STUDENT],
		createdAt: "2024-01-01T00:00",
	};

	const application: Application = {
		uuid: "550e8400-e29b-41d4-a716-446655440005",
		userId: owner.uuid,
		status: ApplicationStatus.SUBMITTED,
		answers: {
			source: Source.TELEGRAM,
			interestReason: "Тест",
			experience: Experience.NONE,
			format: Format.ONLINE,
			goals: Goals.GENERAL,
			intensity: Intensity.BASE,
		},
		createdAt: "2024-01-01T00:00",
		submittedAt: "2024-01-01T00:00",
	};

	describe("canCreate", () => {
		test("любой пользователь может создать заявку", () => {
			expect(ApplicationPolicy.canCreate(owner)).toBe(true);
			expect(ApplicationPolicy.canCreate(stranger)).toBe(true);
		});
	});

	describe("canRead", () => {
		test("владелец может читать свою заявку", () => {
			expect(ApplicationPolicy.canRead(owner, application)).toBe(true);
		});

		test("ADMIN может читать любую заявку", () => {
			expect(ApplicationPolicy.canRead(admin, application)).toBe(true);
		});

		test("MENTOR может читать любую заявку", () => {
			expect(ApplicationPolicy.canRead(mentor, application)).toBe(true);
		});

		test("чужак не может читать чужую заявку", () => {
			expect(ApplicationPolicy.canRead(stranger, application)).toBe(false);
		});
	});

	describe("canList", () => {
		test("ADMIN может листить заявки", () => {
			expect(ApplicationPolicy.canList(admin)).toBe(true);
		});

		test("MENTOR может листить заявки", () => {
			expect(ApplicationPolicy.canList(mentor)).toBe(true);
		});

		test("владелец не может листить заявки", () => {
			expect(ApplicationPolicy.canList(owner)).toBe(false);
		});

		test("чужак не может листить заявки", () => {
			expect(ApplicationPolicy.canList(stranger)).toBe(false);
		});
	});

	describe("canUpdate", () => {
		test("владелец может обновлять свою заявку", () => {
			expect(ApplicationPolicy.canUpdate(owner, application)).toBe(true);
		});

		test("ADMIN может обновлять любую заявку", () => {
			expect(ApplicationPolicy.canUpdate(admin, application)).toBe(true);
		});

		test("MENTOR не может обновлять заявки", () => {
			expect(ApplicationPolicy.canUpdate(mentor, application)).toBe(false);
		});

		test("чужак не может обновлять чужую заявку", () => {
			expect(ApplicationPolicy.canUpdate(stranger, application)).toBe(false);
		});
	});

	describe("isOwner", () => {
		test("возвращает true для владельца", () => {
			expect(ApplicationPolicy.isOwner(owner, application)).toBe(true);
		});

		test("возвращает false для не-владельца", () => {
			expect(ApplicationPolicy.isOwner(stranger, application)).toBe(false);
		});
	});
});
