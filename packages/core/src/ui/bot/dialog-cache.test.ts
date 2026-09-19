import { describe, expect, test } from 'bun:test';
import type { AppMeta } from '#domain/types';
import { BotController } from './bot-controller';
import { BotUiStory } from './bot-ui-story';
import { DialogCache } from './dialog-cache';
import type { BotSession, DialogResponse } from './types';
import { BotUiApp } from './ui-app';

// ── Юнит-тесты кеша ──

describe('DialogCache / эпохальный кеш', () => {
  function sessionOf(path: string, seq: number): BotSession {
    return { dialog: { path, seq } };
  }

  test('hit: set и get в одной эпохе', () => {
    const cache = new DialogCache();
    const session = sessionOf('view-stream/program', 3);

    cache.set(42, 'pages', { total: 5 }, session);

    expect(cache.get<{ total: number }>(42, 'pages', session)).toEqual({
      total: 5,
    });
  });

  test('miss при чужой эпохе: seq вырос (новый вход в диалог)', () => {
    const cache = new DialogCache();
    cache.set(42, 'pages', 'data', sessionOf('a/one', 3));

    expect(cache.get(42, 'pages', sessionOf('a/one', 4))).toBeUndefined();
  });

  test('miss при чужой эпохе: другой path', () => {
    const cache = new DialogCache();
    cache.set(42, 'pages', 'data', sessionOf('a/one', 3));

    expect(cache.get(42, 'pages', sessionOf('b/two', 3))).toBeUndefined();
  });

  test('пользователи изолированы: одинаковые эпохи, разные tgId', () => {
    const cache = new DialogCache();
    const epochA = sessionOf('a/one', 1);
    const epochB = sessionOf('a/one', 1); // коллизия эпох разных людей

    cache.set(42, 'pages', 'данные 42', epochA);
    cache.set(43, 'pages', 'данные 43', epochB);

    expect(cache.get<string>(42, 'pages', epochA)).toBe('данные 42');
    expect(cache.get<string>(43, 'pages', epochB)).toBe('данные 43');
  });

  test('ключи не пересекаются внутри эпохи одного пользователя', () => {
    const cache = new DialogCache();
    const session = sessionOf('a/one', 1);

    cache.set(42, 'pages', 'p', session);
    cache.set(42, 'other', 'o', session);

    expect(cache.get<string>(42, 'pages', session)).toBe('p');
    expect(cache.get<string>(42, 'other', session)).toBe('o');
    expect(cache.get(42, 'unknown', session)).toBeUndefined();
  });

  test('set без диалога — тихий no-op (get miss, пересборка)', () => {
    const cache = new DialogCache();

    cache.set(42, 'pages', 'data', {});

    expect(cache.get(42, 'pages', sessionOf('a/one', 1))).toBeUndefined();
  });

  test('перезапись того же ключа в той же эпохе — новое значение', () => {
    const cache = new DialogCache();
    const session = sessionOf('a/one', 1);

    cache.set(42, 'pages', 'old', session);
    cache.set(42, 'pages', 'new', session);

    expect(cache.get<string>(42, 'pages', session)).toBe('new');
  });

  test('drop(tgId) чистит только записи этого пользователя', () => {
    const cache = new DialogCache();
    const epoch42 = sessionOf('a/one', 1);
    const epoch43 = sessionOf('a/one', 1);

    cache.set(42, 'pages', 'x', epoch42);
    cache.set(43, 'pages', 'y', epoch43);

    cache.drop(42);

    expect(cache.get(42, 'pages', epoch42)).toBeUndefined();
    expect(cache.get<string>(43, 'pages', epoch43)).toBe('y');
  });
});

// ── Интеграция с BotUiApp: каскад init и drop при смене диалога ──

type TestActor = { tgId: number; name: string };

/** Стори-зонд: пишет и читает кеш при каждом callback. */
class ProbeStory extends BotUiStory<AppMeta, TestActor> {
  readonly name = 'probe';
  /** Кеш, увиденный стори при последнем callback (проверка каскада). */
  seenCache?: DialogCache;
  lastRead: unknown = 'unset';

  override async handleCallback(
    action: string,
    actor: TestActor,
    session: BotSession,
  ): Promise<DialogResponse> {
    this.seenCache = this.dialogCache;
    this.dialogCache.set(actor.tgId, 'probe', `written:${action}`, session);
    this.lastRead = this.dialogCache.get(actor.tgId, 'probe', session);
    return {};
  }
}

/** Контроллер с реальной стори-зондом (роутинг BotController). */
class ProbeController extends BotController<AppMeta, TestActor> {
  name = 'a';

  protected override readonly stories = [new ProbeStory()];

  get probe(): ProbeStory {
    return this.stories[0] as ProbeStory;
  }
}

/** Заглушка контроллера «b» для кнопки-моста в чужую стори. */
class OtherController extends BotController<AppMeta, TestActor> {
  name = 'b';
  callbackData: string[] = [];

  protected override readonly stories: BotUiStory<AppMeta, TestActor>[] = [];

  override async handleCallback(
    data: string,
    _actor: TestActor,
    _session: BotSession,
  ): Promise<DialogResponse> {
    this.callbackData.push(data);
    return {};
  }
}

function makeUiApp(controllers: BotController<AppMeta, TestActor>[]) {
  // BotUiApp абстрактен — минимальный конкретный подкласс
  class TestUiApp extends BotUiApp<AppMeta, TestActor> {}
  const uiApp = new TestUiApp(controllers);
  uiApp.init({
    appApi: {} as never,
    eventBus: {} as never,
    actorResolver: async (tgId: number) => ({ tgId, name: 'Тест' }),
  });
  return uiApp;
}

describe('DialogCache / интеграция с BotUiApp', () => {
  test('каскад init: uiApp доставляет кеш в контроллер и стори', async () => {
    const ctrl = new ProbeController();
    const uiApp = makeUiApp([ctrl]);

    expect(uiApp.dialogCache).toBeDefined();
    expect(ctrl.probe.seenCache).toBeUndefined(); // ещё не работала

    // После callback стори видит тот же инстанс кеша, что и uiApp
    // (доставка uiApp → контроллер → стори)
    await uiApp.handleCallback('a:probe:act', 42, {
      dialog: { path: 'a/probe', seq: 1 },
    });
    expect(ctrl.probe.seenCache).toBe(uiApp.dialogCache);
  });

  test('смена диалога кнопкой-мостом → drop кеша только у текущего пользователя', async () => {
    const probe = new ProbeController();
    const other = new OtherController();
    const uiApp = makeUiApp([probe, other]);

    const session42 = { dialog: { path: 'a/probe', seq: 5 } };
    const session43 = { dialog: { path: 'a/probe', seq: 5 } };

    // Оба пользователя поработали в диалоге a/probe — кеш записан
    await uiApp.handleCallback('a:probe:act', 42, session42);
    await uiApp.handleCallback('a:probe:act', 43, session43);
    expect(probe.probe.lastRead).toBe('written:act');

    // Пользователь 42 уходит мостом в чужую стори — новая эпоха, drop
    await uiApp.handleCallback('b:two:view', 42, session42);
    expect(other.callbackData).toEqual(['two:view']);
    expect(session42.dialog).toEqual({ path: 'b/two', seq: 6 });

    // Записи 42 физически сброшены, записи 43 живы
    expect(
      uiApp.dialogCache.get(42, 'probe', {
        dialog: { path: 'a/probe', seq: 5 },
      }),
    ).toBeUndefined();
    expect(
      uiApp.dialogCache.get<string>(43, 'probe', {
        dialog: { path: 'a/probe', seq: 5 },
      }),
    ).toBe('written:act');
  });

  test('кнопка в ту же стори — продолжение диалога, кеш жив', async () => {
    const probe = new ProbeController();
    const uiApp = makeUiApp([probe]);

    const session = { dialog: { path: 'a/probe', seq: 5 } };
    await uiApp.handleCallback('a:probe:first', 42, session);

    // Тот же диалог — enterDialog не инкрементирует, кеш не сбрасывается
    await uiApp.handleCallback('a:probe:second', 42, session);
    expect(session.dialog).toEqual({ path: 'a/probe', seq: 5 });
    expect(probe.probe.lastRead).toBe('written:second');
  });
});
