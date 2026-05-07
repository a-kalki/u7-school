import { describe, expect, test } from "bun:test";
import {
	errAccessDenied,
	errBadRequest,
	errConflict,
	errInternal,
	errNotFound,
	errUnauthorized,
	errValidation,
} from "./error-helpers";
import type { NotFoundError } from "./errors";

describe("error helpers (фабрики ошибок)", () => {
	test("errNotFound создаёт объект с kind=not-found и level=domain", () => {
		const err = errNotFound("USER_NOT_FOUND", "Пользователь не найден", undefined);
		expect(err.kind).toBe("not-found");
		expect(err.level).toBe("domain");
		expect(err.name).toBe("USER_NOT_FOUND");
		expect(err.message).toBe("Пользователь не найден");
		expect(err.payload).toBeUndefined();
	});

	test("errNotFound сохраняет литеральный тип name и payload", () => {
		type E = NotFoundError<"USER_NOT_FOUND", { uuid: string }>;
		const err = errNotFound<E>("USER_NOT_FOUND", "msg", { uuid: "abc" });
		const _nameCheck: "USER_NOT_FOUND" = err.name;
		expect(_nameCheck).toBe("USER_NOT_FOUND");
		expect(err.payload).toEqual({ uuid: "abc" });
	});

	test("errConflict создаёт объект с kind=conflict и level=domain", () => {
		const err = errConflict("TELEGRAM_ID_TAKEN", "Telegram ID занят", {
			telegramId: 123,
		});
		expect(err.kind).toBe("conflict");
		expect(err.level).toBe("domain");
		expect(err.name).toBe("TELEGRAM_ID_TAKEN");
		expect(err.payload).toEqual({ telegramId: 123 });
	});

	test("errAccessDenied создаёт объект с kind=access-denied и level=domain", () => {
		const err = errAccessDenied("ACCESS_DENIED", "Доступ запрещён", undefined);
		expect(err.kind).toBe("access-denied");
		expect(err.level).toBe("domain");
		expect(err.name).toBe("ACCESS_DENIED");
	});

	test("errBadRequest создаёт объект с kind=bad-request и level=api", () => {
		const err = errBadRequest("NO_COMMAND_FOUND", "Команда не найдена", {
			commandName: "test",
			moduleName: "test-module",
		});
		expect(err.kind).toBe("bad-request");
		expect(err.level).toBe("api");
		expect(err.name).toBe("NO_COMMAND_FOUND");
		expect(err.payload).toEqual({ commandName: "test", moduleName: "test-module" });
	});

	test("errUnauthorized создаёт объект с kind=unauthorized и level=api", () => {
		const err = errUnauthorized("UNAUTHORIZED_ERROR", "Требуется авторизация");
		expect(err.kind).toBe("unauthorized");
		expect(err.level).toBe("api");
		expect(err.name).toBe("UNAUTHORIZED_ERROR");
	});

	test("errValidation создаёт объект с kind=validation и level=domain", () => {
		const err = errValidation("INPUT_VALIDATION_ERROR", "Некорректные данные", {
			issues: [],
		});
		expect(err.kind).toBe("validation");
		expect(err.level).toBe("domain");
		expect(err.name).toBe("INPUT_VALIDATION_ERROR");
		expect(err.payload).toEqual({ issues: [] });
	});

	test("errInternal создаёт объект с kind=internal и level=api", () => {
		const err = errInternal("SEVER_INTERNAL_ERROR", "Внутренняя ошибка", undefined);
		expect(err.kind).toBe("internal");
		expect(err.level).toBe("api");
		expect(err.name).toBe("SEVER_INTERNAL_ERROR");
	});

	test("errInternal с payload и level=domain", () => {
		const err = errInternal(
			"OUTPUT_VALIDATION_ERROR",
			"Ошибка выхода",
			{ issues: [{ path: "name", message: "Required" }] },
			"domain",
		);
		expect(err.kind).toBe("internal");
		expect(err.level).toBe("domain");
		expect(err.payload).toEqual({
			issues: [{ path: "name", message: "Required" }],
		});
	});
});
