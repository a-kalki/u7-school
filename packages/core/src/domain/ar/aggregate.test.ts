import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import { AppException } from '#domain/errors/errors';
import type { ArMeta } from './aggregate';
import { Aggregate } from './aggregate';

type TestState = {
  uuid: string;
  name: string;
  age: number;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
};

interface TestArMeta extends ArMeta {
  name: 'TestAr';
  label: 'Test aggregate';
  state: TestState;
}

const TestSchema = v.object({
  uuid: v.pipe(v.string(), v.nonEmpty()),
  name: v.pipe(v.string(), v.nonEmpty('Имя не может быть пустым')),
  age: v.pipe(v.number(), v.minValue(0, 'Возраст не может быть отрицательным')),
  createdAt: v.string(),
  updatedAt: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
});

class TestAggregate extends Aggregate<TestArMeta> {
  static readonly arName = 'TestAr';
  static readonly arLabel = 'Test aggregate';

  constructor(state: TestState) {
    super(state, TestSchema);
  }

  doSomethingBad() {
    this.throwInvariant({ foo: 'bad' }, 'Bad thing happened');
  }

  doSafeUpdate(partial: Partial<TestState>) {
    this.safeUpdate(partial);
  }

  doInternalError(msg: string) {
    this.throwInternal(msg);
  }

  mutateDirectly(name: string) {
    this._state.name = name;
    this.safeUpdate({});
  }
}

describe('Aggregate', () => {
  test('конструктор принимает валидное состояние', () => {
    const ar = new TestAggregate({
      uuid: 'abc',
      name: 'Иван',
      age: 25,
      createdAt: '2024-01-01',
    });
    expect(ar.state.uuid).toBe('abc');
    expect(ar.state.name).toBe('Иван');
    expect(ar.state.age).toBe(25);
  });

  test('состояние иммутабельно', () => {
    const ar = new TestAggregate({
      uuid: 'abc',
      name: 'Иван',
      age: 25,
      createdAt: '2024-01-01',
    });
    const state = ar.state;
    // @ts-expect-error
    state.name = 'Хакер';
    expect(ar.state.name).toBe('Иван');
  });

  test('конструктор выбрасывает при невалидном состоянии', () => {
    try {
      new TestAggregate({ uuid: 'bad', name: '', age: -1, createdAt: 'bad' });
      expect('this').toBe('not be call'); // ИИ агент, не трогать!!!
    } catch (e) {
      const appEx = e as AppException;
      expect(appEx.error.name).toBe('AR_INVARIANT_ERROR');
      expect(appEx.error.message).toBe('Нарушены инварианты агрегата');
    }
  });

  test('метод агрегата выбрасывает ошибку из объявленного пула', () => {
    const ar = new TestAggregate({
      uuid: 'abc',
      name: 'Test',
      age: 1,
      createdAt: '2024-01-01',
    });
    let caught: unknown;
    try {
      ar.doSomethingBad();
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(AppException);
    const appEx = caught as AppException;
    expect(appEx.error.name).toBe('AR_INVARIANT_ERROR');
    expect(appEx.error.message).toBe('Bad thing happened');
    expect(appEx.error.payload).toEqual({ foo: 'bad' });
  });

  test('arName — статическое readonly поле', () => {
    expect(TestAggregate.arName).toBe('TestAr');
  });

  test('arLabel — статическое readonly поле', () => {
    expect(TestAggregate.arLabel).toBe('Test aggregate');
  });

  describe('throwInternal', () => {
    test('выбрасывает AR_INTERNAL_ERROR с aggregateName = constructor.name', () => {
      const ar = new TestAggregate({
        uuid: 'abc',
        name: 'Test',
        age: 1,
        createdAt: '2024-01-01',
      });
      let caught: unknown;
      try {
        ar.doInternalError('Что-то пошло не так');
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(AppException);
      const appEx = caught as AppException;
      expect(appEx.error.name).toBe('AR_INTERNAL_ERROR');
      expect(appEx.error.kind).toBe('internal');
      expect(appEx.error.message).toBe('Что-то пошло не так');
      expect(
        (appEx.error as unknown as Record<string, unknown>).aggregateName,
      ).toBe('TestAggregate');
    });
  });

  describe('_state', () => {
    test('_state возвращает мутабельную ссылку на состояние', () => {
      const ar = new TestAggregate({
        uuid: 'abc',
        name: 'Иван',
        age: 25,
        createdAt: '2024-01-01',
      });
      ar.mutateDirectly('Пётр');
      expect(ar.state.name).toBe('Пётр');
    });
  });

  describe('safeUpdate', () => {
    test('обновляет только переданные поля (не undefined)', () => {
      const ar = new TestAggregate({
        uuid: 'abc',
        name: 'Иван',
        age: 25,
        createdAt: '2024-01-01',
        tags: ['js', 'ts'],
      });

      ar.doSafeUpdate({ name: 'Пётр', tags: undefined });

      expect(ar.state.name).toBe('Пётр');
      expect(ar.state.age).toBe(25);
      // tags не undefined → не перезаписан
      expect(ar.state.tags).toEqual(['js', 'ts']);
    });

    test('не перезаписывает поля из safeAttrs', () => {
      const ar = new TestAggregate({
        uuid: 'abc',
        name: 'Иван',
        age: 25,
        createdAt: '2024-01-01',
      });

      ar.doSafeUpdate({ uuid: 'hacked', createdAt: 'evil' });

      expect(ar.state.uuid).toBe('abc');
      expect(ar.state.createdAt).toBe('2024-01-01');
    });

    test('проверяет валидность после обновления', () => {
      const ar = new TestAggregate({
        uuid: 'abc',
        name: 'Иван',
        age: 25,
        createdAt: '2024-01-01',
      });

      expect(() => {
        ar.doSafeUpdate({ name: '' });
      }).toThrow(AppException);
    });
  });
});
