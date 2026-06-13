import { describe, expect, test } from 'bun:test';
import type { BotUpdate } from './types';

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
