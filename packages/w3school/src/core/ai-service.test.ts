import { describe, expect, mock, test } from 'bun:test';
import { AIService } from './ai-service';

// Мокаем библиотеку openai для DeepSeek API
mock.module('openai', () => {
  return {
    default: class {
      chat = {
        completions: {
          create: async () => {
            return {
              choices: [
                {
                  message: {
                    content: 'This is a summary.',
                  },
                },
              ],
            };
          },
        },
      };
    },
  };
});

describe('AIService', () => {
  test('should call DeepSeek API and return summary', async () => {
    const service = new AIService('test-api-key');
    const summary = await service.getSummary('Lesson Title', 'Lesson Content');

    expect(summary).toBe('This is a summary.');
  });

  test('should handle API errors', async () => {
    // Переопределяем мок на ошибку
    mock.module('openai', () => {
      return {
        default: class {
          chat = {
            completions: {
              create: async () => {
                throw new Error('API Error');
              },
            },
          };
        },
      };
    });

    const service = new AIService('test-key');
    const summary = await service.getSummary('Title', 'Content');
    expect(summary).toBeNull();
  });
});
