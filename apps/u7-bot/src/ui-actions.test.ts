import { describe, expect, test } from 'bun:test';
import {
  type ControllerActions,
  createUiRegistry,
  type HasPublicActions,
  type UiRegistry,
} from './ui-actions';

// ── Тестовые данные ──

/** Мок-контроллер с publicActions (новый формат: возвращает UiBotButton) */
class MockStreamController {
  readonly name = 'stream';

  get publicActions() {
    return {
      catalog: {
        view: (id: string) => ({
          text: 'Просмотр',
          code: `stream:catalog:view:${id}`,
        }),
        list: () => ({
          text: 'Список',
          code: 'stream:catalog:list',
        }),
      },
      learning: {
        open: (streamId: string, stepId: string) => ({
          text: 'Открыть',
          code: `stream:learning:open:${streamId}:${stepId}`,
        }),
      },
    };
  }
}

/** Мок-контроллер без публичных действий */
class MockAppController {
  readonly name = 'app';

  get publicActions() {
    return {};
  }
}

describe('createUiRegistry', () => {
  test('собирает реестр из одного контроллера', () => {
    const streamCtrl = new MockStreamController();

    const registry = createUiRegistry([streamCtrl]);

    expect(registry.stream).toBeDefined();
    expect(registry.stream?.catalog).toBeDefined();
    expect(registry.stream?.catalog?.view).toBeInstanceOf(Function);
    expect(registry.stream?.learning).toBeDefined();
  });

  test('вызов action фабрики возвращает UiBotButton с text и code', () => {
    const streamCtrl = new MockStreamController();
    const registry = createUiRegistry([streamCtrl]);

    const btn = registry.stream?.catalog?.view?.('abc-123');
    expect(btn).toBeDefined();
    expect(btn!.text).toBe('Просмотр');
    expect(btn!.code).toBe('stream:catalog:view:abc-123');
  });

  test('вызов action с несколькими id', () => {
    const streamCtrl = new MockStreamController();
    const registry = createUiRegistry([streamCtrl]);

    const btn = registry.stream?.learning?.open?.('s1', 'step2');
    expect(btn!.code).toBe('stream:learning:open:s1:step2');
  });

  test('объединяет несколько контроллеров', () => {
    const streamCtrl = new MockStreamController();
    const appCtrl = new MockAppController();

    const registry = createUiRegistry([streamCtrl, appCtrl]);

    expect(registry.stream).toBeDefined();
    expect(registry.app).toBeDefined();
    expect(Object.keys(registry)).toHaveLength(2);
  });

  test('пустой массив даёт пустой реестр', () => {
    const registry = createUiRegistry([]);
    expect(Object.keys(registry)).toHaveLength(0);
  });

  test('контроллер без stories (пустые publicActions) даёт пустой объект', () => {
    const appCtrl = new MockAppController();
    const registry = createUiRegistry([appCtrl]);

    expect(registry.app).toBeDefined();
    expect(Object.keys(registry.app ?? {})).toHaveLength(0);
  });

  test('повторный вызов createUiRegistry с тем же контроллером даёт новый реестр', () => {
    const streamCtrl = new MockStreamController();
    const registry1 = createUiRegistry([streamCtrl]);
    const registry2 = createUiRegistry([streamCtrl]);

    expect(registry1.stream?.catalog?.view).toBeInstanceOf(Function);
    expect(registry2.stream?.catalog?.view).toBeInstanceOf(Function);
    expect(registry1.stream).not.toBe(registry2.stream);
  });
});

describe('ControllerActions (тип)', () => {
  test('извлекает тип из контроллера (рантайм-проверка структуры)', () => {
    const streamCtrl = new MockStreamController();
    // ControllerActions<typeof streamCtrl> — тип, проверяем структуру в рантайме
    const actions: ControllerActions<typeof streamCtrl> =
      streamCtrl.publicActions;

    expect(actions.catalog).toBeDefined();
    expect(actions.learning).toBeDefined();
    expect(actions.catalog.view).toBeInstanceOf(Function);
    // Фабрика возвращает UiBotButton
    const btn = actions.catalog.view('test');
    expect(btn.code).toBe('stream:catalog:view:test');
    expect(btn.text).toBe('Просмотр');
  });
});

describe('UiRegistry (тип)', () => {
  test('позволяет доступ через цепочку controller.story.action', () => {
    const streamCtrl = new MockStreamController();
    const registry: UiRegistry = createUiRegistry([streamCtrl]);

    // Доступ: controller → story → action → UiBotButton
    const btn = registry.stream?.catalog?.view?.('test-id');
    expect(btn!.code).toBe('stream:catalog:view:test-id');
    expect(btn!.text).toBe('Просмотр');
  });
});

describe('HasPublicActions (интерфейс)', () => {
  test('объект с name и publicActions соответствует интерфейсу', () => {
    const ctrl: HasPublicActions = {
      name: 'test',
      publicActions: {
        myStory: {
          doSomething: () => ({
            text: 'Сделать',
            code: 'test:myStory:doSomething',
          }),
        },
      },
    };

    const registry = createUiRegistry([ctrl]);
    const btn = registry.test?.myStory?.doSomething?.();
    expect(btn!.text).toBe('Сделать');
    expect(btn!.code).toBe('test:myStory:doSomething');
  });
});
