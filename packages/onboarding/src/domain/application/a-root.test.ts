import { describe, expect, test } from "bun:test";
import { ApplicationAr } from "./a-root";
import type { CreateApplicationCmd } from "./commands/create-application-cmd";
import type { UpdateApplicationCmd } from "./commands/update-application-cmd";
import { Experience } from "./experience";
import { Format } from "./format";
import { Goals } from "./goals";
import { Intensity } from "./intensity";
import { Source } from "./source";
import { ApplicationStatus } from "./status";

describe("ApplicationAr", () => {
	const createCmd: CreateApplicationCmd = {
		userId: "550e8400-e29b-41d4-a716-446655440001",
		answers: {
			source: Source.TELEGRAM,
			interestReason: "Хочу учиться",
			experience: Experience.BEGINNER,
			format: Format.ONLINE,
			goals: Goals.CAREER_CHANGE,
			intensity: Intensity.BASE,
		},
	};

	test("create создаёт заявку со статусом SUBMITTED", () => {
		const ar = ApplicationAr.create(createCmd);

		expect(ar.state.uuid).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		);
		expect(ar.state.userId).toBe(createCmd.userId);
		expect(ar.state.status).toBe(ApplicationStatus.SUBMITTED);
		expect(ar.state.answers).toEqual(createCmd.answers);
		expect(ar.state.createdAt).toBeTruthy();
		expect(ar.state.submittedAt).toBeTruthy();
	});

	test("create валидирует состояние через схему", () => {
		const ar = ApplicationAr.create(createCmd);
		expect(ar.state).toBeDefined();
		expect(ar.state.uuid).toBeDefined();
	});

	test("updateAnswers обновляет ответы и updatedAt", () => {
		const ar = ApplicationAr.create(createCmd);
		const originalUpdatedAt = ar.state.updatedAt;

		const updateCmd: UpdateApplicationCmd = {
			uuid: ar.state.uuid,
			answers: {
				...createCmd.answers,
				interestReason: "Новая причина",
				intensity: Intensity.INTENSIVE,
			},
		};

		ar.updateAnswers(updateCmd);

		expect(ar.state.answers.interestReason).toBe("Новая причина");
		expect(ar.state.answers.intensity).toBe(Intensity.INTENSIVE);
		expect(ar.state.updatedAt).toBeDefined();
		// updatedAt должен быть установлен (если не был до этого)
		if (originalUpdatedAt) {
			expect(ar.state.updatedAt).not.toBe(originalUpdatedAt);
		}
	});

	test("updateAnswers не меняет uuid, userId, createdAt, submittedAt", () => {
		const ar = ApplicationAr.create(createCmd);
		const original = { ...ar.state };

		const updateCmd: UpdateApplicationCmd = {
			uuid: ar.state.uuid,
			answers: {
				...createCmd.answers,
				source: Source.FRIEND,
			},
		};

		ar.updateAnswers(updateCmd);

		expect(ar.state.uuid).toBe(original.uuid);
		expect(ar.state.userId).toBe(original.userId);
		expect(ar.state.createdAt).toBe(original.createdAt);
		expect(ar.state.submittedAt).toBe(original.submittedAt);
	});

	test("state возвращает immutable клон", () => {
		const ar = ApplicationAr.create(createCmd);
		const state1 = ar.state;
		const state2 = ar.state;

		expect(state1).toEqual(state2);
		expect(state1).not.toBe(state2);
	});
});
