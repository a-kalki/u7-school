import OpenAI from 'openai';

export class AIService {
  private readonly model = 'deepseek-v4-flash';
  private ai: OpenAI;

  constructor(apiKey: string) {
    this.ai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey,
    });
  }

  async getSummary(title: string, content: string): Promise<string | null> {
    try {
      const prompt = `You are an educational course methodologist. Analyze the content of the lesson "${title}" and write a brief summary (2-4 sentences, approximately 300 characters).
Write only the summary text in English, without any introductory remarks or preamble.

LESSON CONTENT:
${content}`;

      const response = await this.ai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      });

      if (!response.choices[0]?.message?.content) {
        console.error('Unexpected AI response: missing text');
        return null;
      }

      return response.choices[0].message.content.trim();
    } catch (error: any) {
      console.error(`Error fetching summary: ${error.message}`);
      return null;
    }
  }
}
