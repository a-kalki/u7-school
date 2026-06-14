import { describe, expect, test } from 'bun:test';

describe('@u7-scl/app/ui — UI-компоненты', () => {
  test('U7BotController импортируется', async () => {
    const mod = await import('@u7-scl/app/ui');
    expect(mod.U7BotController).toBeDefined();
  });

  test('U7BotUserStory импортируется', async () => {
    const mod = await import('@u7-scl/app/ui');
    expect(mod.U7BotUserStory).toBeDefined();
  });
});
