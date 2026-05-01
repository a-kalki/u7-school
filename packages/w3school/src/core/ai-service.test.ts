import { describe, expect, mock, spyOn, test } from "bun:test";
import { AIService } from "./ai-service";

// Мокаем библиотеку @google/genai
mock.module("@google/genai", () => {
	return {
		GoogleGenAI: class {
			models = {
				generateContent: async () => {
					return { text: "This is a summary." };
				},
			};
		},
	};
});

describe("AIService", () => {
	test("should call Gemini API and return summary", async () => {
		const service = new AIService("test-api-key");
		const summary = await service.getSummary("Lesson Title", "Lesson Content");

		expect(summary).toBe("This is a summary.");
	});

	test("should handle API errors", async () => {
		const service = new AIService("test-key");

		// Переопределяем мок для генерации ошибки
		// В Bun mock.module стабилен, но для изменения поведения внутри теста
		// проще всего заспаить метод если он доступен

		const ai = (service as any).ai;
		spyOn(ai.models, "generateContent").mockRejectedValue(
			new Error("API Error"),
		);

		const summary = await service.getSummary("Title", "Content");
		expect(summary).toBeNull();
	});
});
