import { describe, expect, test } from 'bun:test';
import {
  errAccessDenied,
  errBadRequest,
  errConflict,
  errInternal,
  errNotFound,
  errUnauthorized,
  errValidation,
} from '#domain/errors/error-helpers';
import { AppException } from '#domain/errors/errors';
import type { AppMeta } from '#domain/types';
import { md, type mdRaw } from '../../shared/markdown';
import { assertMarkdownV2Safe } from '../../shared/markdown-validator';
import { BotUiStory } from './bot-ui-story';
import type { BotSession, BotUpdate, DialogResponse } from './types';

type TestActor = { id: string };

/** Стори-заглушка: открывает protected API (confirm/handleError). */
class TestStory extends BotUiStory<AppMeta, TestActor> {
  readonly name = 'anketa';

  override async handleCallback(
    _action: string,
    _actor: { id: string },
    _session: BotSession,
  ): Promise<DialogResponse> {
    return {};
  }
  override async handleMessage(
    _update: BotUpdate,
    _actor: { id: string },
    _session: BotSession,
  ): Promise<DialogResponse | null> {
    return null;
  }

  // Экспонирование protected для тестов
  callConfirm(
    action: string,
    targetId: string,
    text: ReturnType<typeof mdRaw>,
    opts?: Parameters<TestStory['confirm']>[3],
  ): ReturnType<TestStory['confirm']> {
    return this.confirm(action, targetId, text, opts);
  }
  callHandleError(err: unknown): ReturnType<TestStory['handleError']> {
    return this.handleError(err);
  }
  callCb(action: string, ...ids: string[]): string {
    return this.cb(action, ...ids);
  }
  callCbFor(story: string, action: string, ...ids: string[]): string {
    return this.cbFor(story, action, ...ids);
  }
  callStripPrefix(data: string): string {
    return this.stripPrefix(data);
  }
  callFormatDate(iso: string): string {
    return this.formatDate(iso);
  }
}

describe('BotUiStory — confirm', () => {
  test('строит confirm-экран: кнопки подтверждения и отмены с кодами', () => {
    const story = new TestStory();

    const response = story.callConfirm(
      'complete',
      'uuid-123',
      md`Завершить шаг?`,
    );

    const row = response.screen?.keyboard?.rows[0];
    expect(row?.length).toBe(2);
    expect(row?.[0]).toEqual({
      text: '✅ Да',
      code: 'anketa:complete-confirm:uuid-123',
    });
    expect(row?.[1]).toEqual({
      text: '❌ Отмена',
      code: 'anketa:detail:uuid-123',
    });
    expect(String(response.screen?.text)).toBe('Завершить шаг?');
    expect(response.screen?.keyboard?.isMultiple).toBe(false);
  });

  test('опции: custom-кнопки, cancelCode, extraData', () => {
    const story = new TestStory();

    const response = story.callConfirm('remove', 'id-9', md`Точно?`, {
      confirmButton: '🔥 Снять',
      cancelButton: '◀️ Назад к списку',
      cancelCode: 'anketa:list',
      extraData: 'force',
    });

    const row = response.screen?.keyboard?.rows[0];
    expect(row?.[0]).toEqual({
      text: '🔥 Снять',
      code: 'anketa:remove-confirm:id-9:force',
    });
    expect(row?.[1]).toEqual({ text: '◀️ Назад к списку', code: 'anketa:list' });
  });

  test('confirm-текст — валидный MarkdownV2 с доменными данными', () => {
    const story = new TestStory();
    const dangerous = 'Имя с *спец*символами _и_ [скобками]';

    const response = story.callConfirm('act', 'id', md`Удалить ${dangerous}?`);

    // интерполяция экранирована: литерал целиком валиден
    expect(() =>
      assertMarkdownV2Safe(response.screen?.text ?? ''),
    ).not.toThrow();
    expect(String(response.screen?.text)).toContain(
      'Имя с \\*спец\\*символами',
    );
  });
});

describe('BotUiStory — дефолты контракта', () => {
  test('handleCancel по умолчанию → release', async () => {
    const story = new TestStory();
    const response = await story.handleCancel(
      { id: 'u' },
      { dialog: { path: 'x/y', seq: 1 } },
    );
    expect(response).toEqual({ release: true });
  });

  test('handleHelp по умолчанию → null (общий fallback)', async () => {
    const story = new TestStory();
    const screen = await story.handleHelp(
      { id: 'u' },
      { dialog: { path: 'x/y', seq: 1 } },
    );
    expect(screen).toBeNull();
  });
});

describe('BotUiStory — handleError', () => {
  test('validation с issues → экран-список полей, валидный md', () => {
    const story = new TestStory();

    const response = story.callHandleError(
      new AppException(
        errValidation('VALIDATION', 'Некорректные данные', {
          issues: [
            { path: 'Имя', message: 'слишком *короткое*' },
            { path: 'Email', message: 'невалиден' },
          ],
        }),
      ),
    );

    const text = String(response.screen?.text);
    expect(text).toContain('Имя');
    expect(text).toContain('слишком \\*короткое\\*');
    expect(() => assertMarkdownV2Safe(text)).not.toThrow();
  });

  test('validation без issues → общий экран валидации', () => {
    const story = new TestStory();

    const response = story.callHandleError(
      new AppException(
        errValidation('VALIDATION', 'Что-то не так (скобки) [тут]', undefined),
      ),
    );

    const text = String(response.screen?.text);
    expect(text).toContain('Что\\-то не так \\(скобки\\)');
    expect(() => assertMarkdownV2Safe(text)).not.toThrow();
  });

  test.each([
    [
      'not-found',
      new AppException(errNotFound('ERR', 'Объект [не] найден_', undefined)),
    ],
    [
      'conflict',
      new AppException(errConflict('ERR', 'Конфликт [x] _y_', undefined)),
    ],
    [
      'access-denied',
      new AppException(errAccessDenied('ERR', 'Доступ (закрыт)', undefined)),
    ],
    [
      'bad-request',
      new AppException(errBadRequest('ERR', 'Плохой запрос _[1]', undefined)),
    ],
  ])('%s → экран с текстом ошибки, валидный md', (_kind, error) => {
    const story = new TestStory();

    const response = story.callHandleError(error);

    const text = String(response.screen?.text);
    expect(text).toContain('Объект');
    expect(() => assertMarkdownV2Safe(text)).not.toThrow();
  });

  test.each([
    [
      'internal',
      new AppException(errInternal('ERR', 'boom [x] _y_', undefined)),
    ],
    ['unauthorized', new AppException(errUnauthorized('ERR', 'нет доступа'))],
  ])('%s → общий экран, доменные данные не утекают', (_kind, error) => {
    const story = new TestStory();

    const response = story.callHandleError(error);

    const text = String(response.screen?.text);
    expect(text).not.toContain('внутренняя деталь');
    expect(text).not.toContain('boom');
    expect(() => assertMarkdownV2Safe(text)).not.toThrow();
  });
});

describe('BotUiStory — колбэк-хелперы', () => {
  test('cb: story:action:ids без префикса контроллера', () => {
    const story = new TestStory();
    expect(story.callCb('view', 'id-1', 'id-2')).toBe('anketa:view:id-1:id-2');
  });

  test('cbFor: чужая стори того же контроллера', () => {
    const story = new TestStory();
    expect(story.callCbFor('list', 'open', 'x')).toBe('list:open:x');
  });

  test('stripPrefix снимает префикс только своей стори', () => {
    const story = new TestStory();
    expect(story.callStripPrefix('anketa:view:1')).toBe('view:1');
    expect(story.callStripPrefix('other:view:1')).toBe('other:view:1');
  });

  test('formatDate: ISO → дд.мм.гггг', () => {
    const story = new TestStory();
    expect(story.callFormatDate('2026-09-05T00:00:00Z')).toBe('05.09.2026');
  });
});

// Нужен для типизации update в будущих кейсах (сохраняем поверхность)
describe('BotUiStory — поверхность', () => {
  test('handleCallback/handleMessage реализуемы (контракт не抽象)', async () => {
    const story = new TestStory();
    const session: BotSession = { dialog: { path: 'c/anketa', seq: 1 } };
    const update: BotUpdate = { type: 'message', text: 'текст', telegramId: 1 };

    expect(await story.handleCallback('view', { id: 'u' }, session)).toEqual(
      {},
    );
    expect(await story.handleMessage(update, { id: 'u' }, session)).toBeNull();
  });
});
