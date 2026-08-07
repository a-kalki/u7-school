import { describe, expect, test } from 'bun:test';

describe('@u7-scl/app/ui — UI-компоненты', () => {
  test('U7BotController импортируется из нового пути', async () => {
    const mod = await import('@u7-scl/bot/u7-bot-controller');
    expect(mod.U7BotController).toBeDefined();
  });

  test('U7BotUserStory импортируется из нового пути', async () => {
    const mod = await import('@u7-scl/bot/u7-bot-user-story');
    expect(mod.U7BotUserStory).toBeDefined();
  });

  test('AppController импортируется из нового пути', async () => {
    const mod = await import('@u7-scl/bot/app/app-controller');
    expect(mod.AppController).toBeDefined();
  });
});
