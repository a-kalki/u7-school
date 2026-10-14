import { describe, expect, mock, test } from 'bun:test';
import { TEST_SCHOOL, type User } from '@u7-scl/app/domain';
import type { BotSession } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { SchoolController } from './controller';

describe('SchoolController (реестр)', () => {
  const actor: User = {
    uuid: 'u1',
    name: 'Гость',
    telegramId: 123456,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const session: BotSession = {
    dialog: { path: 'school/hub', seq: 1 },
  };

  test('имя контроллера — school', () => {
    const controller = new SchoolController();
    expect(controller.name).toBe('school');
  });

  test('содержит SchoolHubStory и SchoolInfoStory', () => {
    const controller = new SchoolController();
    const stories = (
      controller as unknown as { stories: Array<{ name: string }> }
    ).stories;
    expect(stories.some((s) => s.name === 'hub')).toBe(true);
    expect(stories.some((s) => s.name === 'info')).toBe(true);
  });

  test('menuButtons агрегирует кнопку «🏫 Школа» с префиксом контроллера', async () => {
    const controller = new SchoolController();
    controller.init({
      school: TEST_SCHOOL,
      appApi: { execute: mock(async () => []) },
    } as any);

    const items = await controller.menuButtons(actor);
    expect(items).toHaveLength(1);
    const btn = items[0]!;
    expect(btn.text).toBe('🏫 Школа');
    expect(btn.priority).toBe(10);
    expect(btn.kind).toBe('callback');
    if (btn.kind === 'callback') {
      expect(btn.action).toBe('school:hub:open');
    }
  });

  test('handleCallback форвардит hub:open в SchoolHubStory и возвращает карточку SH01 с кнопками', async () => {
    const controller = new SchoolController();
    controller.init({
      school: TEST_SCHOOL,
      appApi: { execute: mock(async () => []) },
    } as any);

    const response = await controller.handleCallback(
      'hub:open',
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    expect(String(response.screen?.text)).toContain(TEST_SCHOOL.name);

    const rows = response.screen?.keyboard?.rows ?? [];
    expect(rows).toHaveLength(5);
    expect(rows[0]![0]!.text).toBe('📚 Потоки');
    expect(rows[1]![0]!.text).toBe('💬 Отзывы');
    expect(rows[2]![0]!.text).toBe('ℹ️ Инфо');
    expect(rows[2]![0]!.code).toBe('school:info:view');
    expect(rows[3]![0]!.text).toBe('💬 Сообщество');
    expect(rows[3]![0]!.url).toBe(TEST_SCHOOL.communityGroup.url);
    expect(rows[4]![0]!.text).toBe('↩️ Главное меню');
  });

  test('handleCallback форвардит info:view в SchoolInfoStory и возвращает экран SH02 с кнопкой возврата', async () => {
    const controller = new SchoolController();
    controller.init({
      school: TEST_SCHOOL,
      appApi: { execute: mock(async () => []) },
    } as any);

    const response = await controller.handleCallback(
      'info:view',
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain(TEST_SCHOOL.name);
    expect(text).toContain('Развиваем не только хард');
    expect(text).toContain('BatysHub');
    expect(text).toContain('Исатая');
    expect(text).toContain('777 287 8182');

    const rows = response.screen?.keyboard?.rows ?? [];
    expect(rows).toHaveLength(1);
    expect(rows[0]![0]!.text).toBe('⬅️ Назад в школу');
    expect(rows[0]![0]!.code).toBe('school:hub:open');
  });
});
