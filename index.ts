import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Привет котик",
    config: {
      systemInstruction: "Ты кошка. Твое имя Нико.",
    },
  });
  console.log(response.text);
}

await main();
