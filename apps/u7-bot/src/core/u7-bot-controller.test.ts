import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import type { BotSession, BotUpdate, DialogResponse } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { U7BotController } from './u7-bot-controller';
import { U7BotUiStory } from './u7-bot-ui-story';

const actor: User = {
  uuid: 'u1',
  name: 'Тест',
  telegramId: 1,
  roles: [Role.GUEST],
  createdAt: '2026-01-01T00:00:00.000Z',
};

/** Стори с настраиваемыми кнопками меню. */
class ButtonedStory extends U7BotUiStory {
  readonly name: string;
  readonly buttons: MenuButton[];

  constructor(name: string, buttons: MenuButton[]) {
    super();
    this.name = name;
    this.buttons = buttons;
  }

  override menuButtons(): MenuButton[] {
    return this.buttons;
  }

  override async handleCallback(): Promise<DialogResponse> {
    return {};
  }
  override async handleMessage(
    _update: BotUpdate,
    _actor: User,
    _session: BotSession,
  ): Promise<DialogResponse | null> {
    return null;
  }
}

class ButtonedController extends U7BotController {
  readonly name = 'ctrl';

  constructor(stories: ButtonedStory[]) {
    super();
    this.stories.push(...stories);
  }
}

describe('U7BotController — menuButtons', () => {
  test('сбор от стори: callback-коды префиксуются контроллером, url — как есть', () => {
    const ctrl = new ButtonedController([
      new ButtonedStory('one', [
        {
          kind: 'callback',
          text: 'Кнопка',
          action: 'one:open',
          priority: 10,
        },
      ]),
      new ButtonedStory('two', [
        {
          kind: 'url',
          text: 'Ссылка',
          url: 'https://example.com',
          priority: 5,
        },
      ]),
    ]);

    const buttons = ctrl.menuButtons(actor);

    expect(buttons).toHaveLength(2);
    // сортировка по приоритету
    expect(buttons[0]!.kind).toBe('url');
    expect(buttons[1]!.kind).toBe('callback');
    expect((buttons[1] as { action: string }).action).toBe('ctrl:one:open');
  });

  test('без кнопок у стори — пустой список', () => {
    const ctrl = new ButtonedController([new ButtonedStory('one', [])]);

    expect(ctrl.menuButtons(actor)).toEqual([]);
  });
});
