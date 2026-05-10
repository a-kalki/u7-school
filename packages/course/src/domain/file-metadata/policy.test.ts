import { describe, expect, test } from "bun:test";
import type { User } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import { FileMetadataPolicy } from "./policy";

function makeActor(roles: Role[]): User {
	return {
		uuid: crypto.randomUUID(),
		name: "Тест",
		telegramId: 1,
		roles,
		createdAt: "2026-05-01T12:00",
	};
}

const file = {
	uuid: "550e8400-e29b-41d4-a716-446655440000",
	courseId: "660e8400-e29b-41d4-a716-446655440001",
	name: "test.pdf",
	url: "https://example.com/test.pdf",
	mimeType: "application/pdf",
	createdAt: "2026-05-01T12:00",
};

describe("FileMetadataPolicy", () => {
	describe("canCreate", () => {
		test("ADMIN может создавать", () => {
			expect(FileMetadataPolicy.canCreate(makeActor([Role.ADMIN]))).toBe(true);
		});

		test("MENTOR может создавать", () => {
			expect(FileMetadataPolicy.canCreate(makeActor([Role.MENTOR]))).toBe(true);
		});

		test("STUDENT не может создавать", () => {
			expect(FileMetadataPolicy.canCreate(makeActor([Role.STUDENT]))).toBe(
				false,
			);
		});
	});

	describe("canRead", () => {
		test("любой пользователь может читать", () => {
			expect(FileMetadataPolicy.canRead(makeActor([Role.STUDENT]), file)).toBe(
				true,
			);
			expect(FileMetadataPolicy.canRead(makeActor([Role.ADMIN]), file)).toBe(
				true,
			);
		});
	});

	describe("canEdit", () => {
		test("ADMIN может редактировать", () => {
			expect(FileMetadataPolicy.canEdit(makeActor([Role.ADMIN]), file)).toBe(
				true,
			);
		});

		test("MENTOR не может редактировать чужой файл", () => {
			expect(FileMetadataPolicy.canEdit(makeActor([Role.MENTOR]), file)).toBe(
				false,
			);
		});

		test("STUDENT не может редактировать", () => {
			expect(FileMetadataPolicy.canEdit(makeActor([Role.STUDENT]), file)).toBe(
				false,
			);
		});
	});
});
