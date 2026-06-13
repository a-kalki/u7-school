import { describe, expect, test } from 'bun:test';
import type { BotResponse, BotUpdate } from './types';

describe('BotUpdate', () => {
  test('поддерживает тип document', () => {
    const update: BotUpdate = {
      type: 'document',
      fileId: 'doc123',
      telegramId: 456,
    };
    expect(update.type).toBe('document');
    expect(update.fileId).toBe('doc123');
    expect(update.telegramId).toBe(456);
  });

  test('поддерживает тип photo', () => {
    const update: BotUpdate = {
      type: 'photo',
      fileId: 'photo123',
      telegramId: 789,
    };
    expect(update.type).toBe('photo');
    expect(update.fileId).toBe('photo123');
    expect(update.telegramId).toBe(789);
  });

  test('поддерживает тип voice', () => {
    const update: BotUpdate = {
      type: 'voice',
      fileId: 'voice123',
      telegramId: 101,
    };
    expect(update.type).toBe('voice');
    expect(update.fileId).toBe('voice123');
    expect(update.telegramId).toBe(101);
  });

  test('всё ещё поддерживает существующие типы', () => {
    const cmd: BotUpdate = { type: 'command', command: '/start', telegramId: 1 };
    const msg: BotUpdate = { type: 'message', text: 'привет', telegramId: 2 };
    const cb: BotUpdate = {
      type: 'callback',
      data: 'some_data',
      telegramId: 3,
      messageId: 100,
    };
    expect(cmd.type).toBe('command');
    expect(msg.type).toBe('message');
    expect(cb.type).toBe('callback');
  });
});

describe('BotResponse', () => {
  test('поддерживает captureInput', () => {
    const resp: BotResponse = {
      captureInput: { path: '/some/path', context: { foo: 42 }, ttlSeconds: 300 },
    };
    expect(resp.captureInput?.path).toBe('/some/path');
    expect(resp.captureInput?.context).toEqual({ foo: 42 });
    expect(resp.captureInput?.ttlSeconds).toBe(300);
  });

  test('captureInput с минимальными полями', () => {
    const resp: BotResponse = {
      captureInput: { path: '/another' },
    };
    expect(resp.captureInput?.path).toBe('/another');
    expect(resp.captureInput?.context).toBeUndefined();
    expect(resp.captureInput?.ttlSeconds).toBeUndefined();
  });

  test('поддерживает releaseInput', () => {
    const resp: BotResponse = { releaseInput: true };
    expect(resp.releaseInput).toBe(true);
  });

  test('поддерживает delegate', () => {
    const resp: BotResponse = { delegate: { path: '/delegated' } };
    expect(resp.delegate?.path).toBe('/delegated');
  });

  test('всё ещё поддерживает существующие поля', () => {
    const resp: BotResponse = {
      sendMessage: { text: 'Hello' },
      questionnaireCompleted: true,
    };
    expect(resp.sendMessage?.text).toBe('Hello');
    expect(resp.questionnaireCompleted).toBe(true);
  });
});
