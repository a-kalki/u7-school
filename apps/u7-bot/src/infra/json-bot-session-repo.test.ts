import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { JsonFileRepoError } from '@u7-scl/core/infra';
import type { BotSession } from '@u7-scl/core/ui';
import { JsonBotSessionRepo } from './json-bot-session-repo';

/**
 * Тесты JSON-хранилища сессий (трек bot-ui-session-persist):
 * round-trip сессий и shortId-маппинга, Valibot-валидация при чтении,
 * fail-fast на битом файле (без молчаливых пересозданий).
 */

let tmpDir: string;

const sessionsFile = () => `${tmpDir}/bot-sessions.json`;
const shortIdsFile = () => `${tmpDir}/bot-short-ids.json`;

/** Полная сессия: dialog (path/seq/input) + screen (messageId/keyboard). */
const fullSession: BotSession = {
  dialog: {
    path: 'courses/fill',
    seq: 7,
    input: { context: { questionIndex: 3 } },
  },
  screen: {
    messageId: 42,
    ownerSeq: 7,
    text: 'Вопрос 3',
    keyboard: {
      rows: [
        [{ text: 'Ответ A', code: 'fill:answer:~7' }],
        [
          { text: 'Открыть', code: 'stream:view:~a1b2c3d4' },
          { text: 'Google', code: '', url: 'https://google.com' },
        ],
      ],
      isMultiple: false,
    },
  },
};

describe('JsonBotSessionRepo — сессии', () => {
  let repo: JsonBotSessionRepo;

  beforeEach(() => {
    tmpDir = mkdtempSync('/tmp/json-bot-session-repo-test-');
    repo = new JsonBotSessionRepo(sessionsFile(), shortIdsFile());
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('round-trip: save → loadAll возвращает сессию (dialog + screen)', async () => {
    await repo.save(123, fullSession);

    const all = await repo.loadAll();
    expect(all.get(123)).toEqual(fullSession);
  });

  test('round-trip минимальной сессии (пустой объект, без input.context)', async () => {
    await repo.save(1, {});

    const all = await repo.loadAll();
    expect(all.get(1)).toEqual({});
  });

  test('loadAll пуст для отсутствующего файла (старт с чистого листа)', async () => {
    const all = await repo.loadAll();
    expect(all.size).toBe(0);
  });

  test('save той же сессии перезаписывает (ключ — tgId)', async () => {
    await repo.save(123, fullSession);
    const changed: BotSession = {
      dialog: { path: 'app/menu', seq: 9 },
    };
    await repo.save(123, changed);

    const all = await repo.loadAll();
    expect(all.size).toBe(1);
    expect(all.get(123)).toEqual(changed);
  });

  test('несколько чатов хранятся вместе', async () => {
    await repo.save(1, fullSession);
    await repo.save(2, { dialog: { path: 'app/menu', seq: 1 } });

    const all = await repo.loadAll();
    expect(all.size).toBe(2);
    expect(all.get(1)?.dialog?.path).toBe('courses/fill');
    expect(all.get(2)?.dialog?.path).toBe('app/menu');
  });

  test('remove удаляет сессию', async () => {
    await repo.save(123, fullSession);
    await repo.remove(123);

    const all = await repo.loadAll();
    expect(all.has(123)).toBe(false);
  });

  test('remove отсутствующей сессии — no-op', async () => {
    await repo.save(1, fullSession);
    await repo.remove(999);

    const all = await repo.loadAll();
    expect(all.size).toBe(1);
  });

  test('save создаёт недостающие директории', async () => {
    const nested = new JsonBotSessionRepo(
      `${tmpDir}/a/b/sessions.json`,
      `${tmpDir}/a/b/short-ids.json`,
    );
    await nested.save(5, fullSession);

    const all = await nested.loadAll();
    expect(all.get(5)).toEqual(fullSession);
  });
});

describe('JsonBotSessionRepo — shortId-маппинг', () => {
  let repo: JsonBotSessionRepo;

  beforeEach(() => {
    tmpDir = mkdtempSync('/tmp/json-bot-session-repo-test-');
    repo = new JsonBotSessionRepo(sessionsFile(), shortIdsFile());
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('round-trip: saveShortId → loadShortIds', async () => {
    await repo.saveShortId('~a1b2c3d4', 'a1b2c3d4-0001-0000-0000-000000000001');
    await repo.saveShortId('~deadbeef', 'deadbeef-0002-0000-0000-000000000002');

    const map = await repo.loadShortIds();
    expect(map.get('~a1b2c3d4')).toBe('a1b2c3d4-0001-0000-0000-000000000001');
    expect(map.get('~deadbeef')).toBe('deadbeef-0002-0000-0000-000000000002');
  });

  test('суффиксы коллизий — разные ключи, разные значения', async () => {
    const uuidA = 'a1b2c3d4-0001-0000-0000-000000000001';
    const uuidB = 'a1b2c3d4-0002-0000-0000-000000000002';
    await repo.saveShortId('~a1b2c3d4', uuidA);
    await repo.saveShortId('~a1b2c3d4-1', uuidB);

    const map = await repo.loadShortIds();
    expect(map.get('~a1b2c3d4')).toBe(uuidA);
    expect(map.get('~a1b2c3d4-1')).toBe(uuidB);
  });

  test('перезапись того же ключа легальна', async () => {
    await repo.saveShortId('~a1b2c3d4', 'old-uuid');
    await repo.saveShortId('~a1b2c3d4', 'new-uuid');

    const map = await repo.loadShortIds();
    expect(map.size).toBe(1);
    expect(map.get('~a1b2c3d4')).toBe('new-uuid');
  });

  test('loadShortIds пуст для отсутствующего файла', async () => {
    expect((await repo.loadShortIds()).size).toBe(0);
  });
});

describe('JsonBotSessionRepo — повреждение данных', () => {
  let repo: JsonBotSessionRepo;

  beforeEach(() => {
    tmpDir = mkdtempSync('/tmp/json-bot-session-repo-test-');
    repo = new JsonBotSessionRepo(sessionsFile(), shortIdsFile());
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('fail-fast: битый JSON сессий → JsonFileRepoError, файл не пересоздан', async () => {
    writeFileSync(sessionsFile(), '{ битый json');

    await expect(repo.loadAll()).rejects.toThrow(JsonFileRepoError);
    expect(readFileSync(sessionsFile(), 'utf8')).toBe('{ битый json');
  });

  test('fail-fast: битый JSON shortIds → JsonFileRepoError', async () => {
    writeFileSync(shortIdsFile(), 'не-json-вообще');

    await expect(repo.loadShortIds()).rejects.toThrow(JsonFileRepoError);
    expect(readFileSync(shortIdsFile(), 'utf8')).toBe('не-json-вообще');
  });

  test('Valibot-валидация: запись с невалидной сессией пропускается при чтении', async () => {
    const broken = JSON.stringify([
      { tgId: 'не-число', session: {} },
      { tgId: 7, session: { dialog: { path: 'app/menu', seq: 1 } } },
    ]);
    writeFileSync(sessionsFile(), broken);

    const all = await repo.loadAll();
    expect(all.size).toBe(1);
    expect(all.get(7)?.dialog?.path).toBe('app/menu');
  });

  test('Valibot-валидация: невалидная shortId-запись пропускается', async () => {
    const broken = JSON.stringify([
      { key: '~ok1', uuid: 'uuid-1' },
      { key: '~bad', uuid: 42 },
    ]);
    writeFileSync(shortIdsFile(), broken);

    const map = await repo.loadShortIds();
    expect(map.size).toBe(1);
    expect(map.get('~ok1')).toBe('uuid-1');
  });

  test('save после обнаружения невалидных записей не теряет валидные', async () => {
    const broken = JSON.stringify([
      { tgId: 7, session: { dialog: { path: 'app/menu', seq: 1 } } },
      { мусор: true },
    ]);
    writeFileSync(sessionsFile(), broken);

    await repo.save(8, fullSession);

    const all = await repo.loadAll();
    expect(all.size).toBe(2);
    expect(all.get(7)?.dialog?.path).toBe('app/menu');
    expect(all.get(8)).toEqual(fullSession);
  });
});
