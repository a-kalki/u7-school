export class AIService {
  private readonly model = "gemini-1.5-flash-latest"; // Использую актуальную модель

  constructor(private apiKey: string) {}

  async getSummary(title: string, content: string): Promise<string | null> {
    if (!this.apiKey) {
      console.error("GEMINI_API_KEY is not set");
      return null;
    }

    const prompt = `You are an educational course methodologist. Analyze the content of the lesson "${title}" and write a brief summary (2-4 sentences, approximately 300 characters).
Write only the summary text in English, without any introductory remarks or preamble.

LESSON CONTENT:
${content}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200,
          },
        }),
      });

      if (!response.ok) {
        console.error(`Gemini API error: ${response.status}`);
        return null;
      }

      const data = (await response.json()) as any;

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        console.error("Unexpected Gemini response structure");
        return null;
      }

      return data.candidates[0].content.parts[0].text.trim();
    } catch (error: any) {
      console.error(`Error fetching summary: ${error.message}`);
      return null;
    }
  }
}
