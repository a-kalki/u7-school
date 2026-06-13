import { beforeEach, describe, expect, test } from 'bun:test';
import { BotController } from './controller/bot-controller';
import { ControllerRegistry } from './controller-registry';
import type { BotResponse, BotUpdate } from './types';

// Минимальная реализация контроллера для тестов
class TestCtrl extends BotController {
  readonly name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  async handleUpdate(
    _update: BotUpdate,
    _actorId: string,
  ): Promise<BotResponse> {
    return { sendMessage: { text: 'ok' } };
  }
}

describe('ControllerRegistry', () => {
  let registry: ControllerRegistry;

  beforeEach(() => {
    registry = new ControllerRegistry();
  });

  describe('register', () => {
    test('успешно регистрирует контроллер', () => {
      const ctrl = new TestCtrl('my_controller');
      expect(() => registry.register(ctrl)).not.toThrow();
    });

    test('выбрасывает ошибку при дубликате имени', () => {
      registry.register(new TestCtrl('my_controller'));
      expect(() =>
        registry.register(new TestCtrl('my_controller')),
      ).toThrow("Контроллер с именем 'my_controller' уже зарегистрирован");
    });

    test('разные имена — без конфликтов', () => {
      expect(() => registry.register(new TestCtrl('ctrl_a'))).not.toThrow();
      expect(() => registry.register(new TestCtrl('ctrl_b'))).not.toThrow();
    });
  });

  describe('get', () => {
    test('возвращает контроллер по имени', () => {
      const ctrl = new TestCtrl('target');
      registry.register(ctrl);
      expect(registry.get('target')).toBe(ctrl);
    });

    test('возвращает undefined для неизвестного имени', () => {
      expect(registry.get('unknown')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    test('возвращает пустой массив для пустого реестра', () => {
      expect(registry.getAll()).toEqual([]);
    });

    test('возвращает все зарегистрированные контроллеры', () => {
      const a = new TestCtrl('ctrl_a');
      const b = new TestCtrl('ctrl_b');
      registry.register(a);
      registry.register(b);

      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContain(a);
      expect(all).toContain(b);
    });
  });
});
