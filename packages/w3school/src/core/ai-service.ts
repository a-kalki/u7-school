import { GoogleGenAI } from "@google/genai";

export class AIService {
  private readonly model = "gemini-3.1-flash-lite-preview";
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async getSummary(title: string, content: string): Promise<string | null> {
    try {
      const prompt = `You are an educational course methodologist. Analyze the content of the lesson "${title}" and write a brief summary (2-4 sentences, approximately 300 characters).
Write only the summary text in English, without any introductory remarks or preamble.

LESSON CONTENT:
${content}`;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200,
        },
      });

      if (!response.text) {
        console.error("Unexpected Gemini response: missing text");
        return null;
      }

      return response.text.trim();
    } catch (error: any) {
      console.error(`Error fetching summary: ${error.message}`);
      return null;
    }
  }
}
