import { describe, expect, test } from "bun:test";
import type { User } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import type { Questionnaire } from "./entity";
import { QuestionnairePolicy } from "./policy";

function makeActor(roles: Role[], uuid = "actor-uuid"): User {
	return {
		uuid,
		name: "Тест",
		telegramId: 1,
		roles,
		createdAt: "2026-05-01T12:00",
	};
}

const questionnaire: Questionnaire = {
	uuid: "q-uuid",
	userId: "owner-uuid",
	status: "in_progress",
	answers: [],
	currentQuestionCode: "q1",
	createdAt: "2026-05-01T12:00",
};

describe("QuestionnairePolicy", () => {
	describe("canCreate", () => {
		test("можно создать анкету для себя", () => {
			expect(
				QuestionnairePolicy.canCreate(
					makeActor([Role.GUEST], "user-1"),
					"user-1",
				),
			).toBe(true);
		});

		test("нельзя создать анкету для другого", () => {
			expect(
				QuestionnairePolicy.canCreate(
					makeActor([Role.GUEST], "user-1"),
					"user-2",
				),
			).toBe(false);
		});

		test("ADMIN может создать анкету для другого", () => {
			expect(
				QuestionnairePolicy.canCreate(
					makeActor([Role.ADMIN], "admin-1"),
					"user-1",
				),
			).toBe(true);
		});
	});

	describe("isOwner", () => {
		test("владелец — true", () => {
			expect(
				QuestionnairePolicy.isOwner(
					makeActor([Role.GUEST], "owner-uuid"),
					questionnaire,
				),
			).toBe(true);
		});

		test("не владелец — false", () => {
			expect(
				QuestionnairePolicy.isOwner(
					makeActor([Role.ADMIN], "other-uuid"),
					questionnaire,
				),
			).toBe(false);
		});
	});

	describe("canRead", () => {
		test("владелец может читать", () => {
			expect(
				QuestionnairePolicy.canRead(
					makeActor([Role.GUEST], "owner-uuid"),
					questionnaire,
				),
			).toBe(true);
		});

		test("ADMIN может читать", () => {
			expect(
				QuestionnairePolicy.canRead(
					makeActor([Role.ADMIN], "other-uuid"),
					questionnaire,
				),
			).toBe(true);
		});

		test("MENTOR может читать", () => {
			expect(
				QuestionnairePolicy.canRead(
					makeActor([Role.MENTOR], "other-uuid"),
					questionnaire,
				),
			).toBe(true);
		});

		test("чужой STUDENT не может читать", () => {
			expect(
				QuestionnairePolicy.canRead(
					makeActor([Role.STUDENT], "other-uuid"),
					questionnaire,
				),
			).toBe(false);
		});
	});

	describe("canList", () => {
		test("ADMIN может просматривать список", () => {
			expect(QuestionnairePolicy.canList(makeActor([Role.ADMIN]))).toBe(true);
		});

		test("MENTOR может просматривать список", () => {
			expect(QuestionnairePolicy.canList(makeActor([Role.MENTOR]))).toBe(true);
		});

		test("владелец не может просматривать список", () => {
			expect(
				QuestionnairePolicy.canList(makeActor([Role.GUEST], "owner-uuid")),
			).toBe(false);
		});

		test("STUDENT не может просматривать список", () => {
			expect(QuestionnairePolicy.canList(makeActor([Role.STUDENT]))).toBe(
				false,
			);
		});
	});

	describe("canSubmitAnswer", () => {
		test("владелец in_progress может отвечать", () => {
			expect(
				QuestionnairePolicy.canSubmitAnswer(
					makeActor([Role.GUEST], "owner-uuid"),
					questionnaire,
				),
			).toBe(true);
		});

		test("владелец completed не может отвечать", () => {
			expect(
				QuestionnairePolicy.canSubmitAnswer(
					makeActor([Role.GUEST], "owner-uuid"),
					{ ...questionnaire, status: "completed" },
				),
			).toBe(false);
		});

		test("ADMIN может отвечать чужую анкету", () => {
			expect(
				QuestionnairePolicy.canSubmitAnswer(
					makeActor([Role.ADMIN], "other-uuid"),
					questionnaire,
				),
			).toBe(true);
		});

		test("ADMIN не может отвечать на завершённую анкету", () => {
			expect(
				QuestionnairePolicy.canSubmitAnswer(
					makeActor([Role.ADMIN], "other-uuid"),
					{ ...questionnaire, status: "completed" },
				),
			).toBe(false);
		});
	});

	describe("canAbandon", () => {
		test("владелец может прервать", () => {
			expect(
				QuestionnairePolicy.canAbandon(
					makeActor([Role.GUEST], "owner-uuid"),
					questionnaire,
				),
			).toBe(true);
		});

		test("ADMIN может прервать чужую анкету", () => {
			expect(
				QuestionnairePolicy.canAbandon(
					makeActor([Role.ADMIN], "other-uuid"),
					questionnaire,
				),
			).toBe(true);
		});

		test("MENTOR не может прервать чужую анкету", () => {
			expect(
				QuestionnairePolicy.canAbandon(
					makeActor([Role.MENTOR], "other-uuid"),
					questionnaire,
				),
			).toBe(false);
		});
	});
});
