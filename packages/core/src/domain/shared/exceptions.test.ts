import { describe, expect, test } from "bun:test";
import { ApiException, AppException, DomainException } from "./exceptions";

describe("DomainException", () => {
	test("должен создаваться с корректными полями", () => {
		const ex = new DomainException(
			"TestError",
			"Сообщение для пользователя",
			"Отладочная информация",
			422,
			{ field: "name" },
		);

		expect(ex).toBeInstanceOf(Error);
		expect(ex).toBeInstanceOf(AppException);
		expect(ex).toBeInstanceOf(DomainException);
		expect(ex.name).toBe("TestError");
		expect(ex.userMessage).toBe("Сообщение для пользователя");
		expect(ex.debugInfo).toBe("Отладочная информация");
		expect(ex.httpStatus).toBe(422);
		expect(ex.level).toBe("domain");
		expect(ex.message).toBe("Сообщение для пользователя");
		expect(ex.payload).toEqual({ field: "name" });
	});

	test("validation — фабричный метод с payload валидации", () => {
		const ex = DomainException.validation(
			"Некорректные данные",
			"name пустое",
			{ name: ["Не может быть пустым"] },
		);

		expect(ex.name).toBe("DomainValidationError");
		expect(ex.httpStatus).toBe(422);
		expect(ex.payload).toEqual({ name: ["Не может быть пустым"] });
	});

	test("conflict — фабричный метод", () => {
		const ex = DomainException.conflict(
			"Пользователь уже существует",
			"telegramId=123 дубликат",
		);

		expect(ex.name).toBe("DomainConflictError");
		expect(ex.httpStatus).toBe(409);
	});

	test("notFound — фабричный метод", () => {
		const ex = DomainException.notFound("Пользователь", "uuid-123");

		expect(ex.name).toBe("DomainNotFoundError");
		expect(ex.httpStatus).toBe(404);
		expect(ex.userMessage).toBe("Пользователь не найден(а)");
	});

	test("accessDenied — фабричный метод", () => {
		const ex = DomainException.accessDenied(
			"Только ADMIN может создавать пользователей",
			"роль STUDENT",
		);

		expect(ex.name).toBe("DomainAccessDeniedError");
		expect(ex.httpStatus).toBe(403);
		expect(ex.level).toBe("domain");
	});

	test("rest() — возвращает объект для HTTP-ответа", () => {
		const ex = DomainException.validation("Ошибка", "детали", { key: "val" });
		const r = ex.rest();

		expect(r).toEqual({
			error: "DomainValidationError",
			message: "Ошибка",
			status: 422,
			payload: { key: "val" },
		});
	});
});

describe("ApiException", () => {
	test("accessDenied — фабричный метод", () => {
		const ex = ApiException.accessDenied(
			"Недостаточно прав",
			"роль STUDENT не может создавать пользователей",
		);

		expect(ex.name).toBe("AccessDeniedError");
		expect(ex.httpStatus).toBe(403);
		expect(ex.level).toBe("api");
		expect(ex).toBeInstanceOf(ApiException);
	});

	test("rest() — возвращает объект для HTTP-ответа", () => {
		const ex = ApiException.accessDenied("Нет прав", "детали");
		const r = ex.rest();

		expect(r.error).toBe("AccessDeniedError");
		expect(r.status).toBe(403);
		expect(r.message).toBe("Нет прав");
		expect(r.payload).toBeNull();
	});
});
