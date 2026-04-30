import { expect, test, describe, spyOn } from "bun:test";
import { AIService } from "./ai-service";

describe("AIService", () => {
  test("should call Gemini API with correct prompt", async () => {
    const mockApiKey = "test-api-key";
    const service = new AIService(mockApiKey);

    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: "This is a summary." }],
          },
        },
      ],
    };

    // Мокаем глобальный fetch
    const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify(mockResponse)))
    );

    const summary = await service.getSummary("Lesson Title", "Lesson Content");

    expect(summary).toBe("This is a summary.");
    expect(fetchSpy).toHaveBeenCalled();
    
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url.toString()).toContain(mockApiKey);
    const body = JSON.parse(init?.body as string);
    expect(body.contents[0].parts[0].text).toContain("Lesson Title");
    expect(body.contents[0].parts[0].text).toContain("Lesson Content");

    fetchSpy.mockRestore();
  });

  test("should handle API errors", async () => {
    const service = new AIService("test-key");
    spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(new Response("Error", { status: 500 }))
    );

    const summary = await service.getSummary("Title", "Content");
    expect(summary).toBeNull();
  });
});
