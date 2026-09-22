import { describe, expect, test } from 'bun:test';
import type { Api } from 'grammy';
import { DEV_PERSONAS, DevPersonaSwitch } from './dev-persona';

const DEV_TG = 999_111;

/** Минимальный ctx-заглушки: dev-persona касается только from и message.text. */
function ctxOf(fromId: number | undefined, text?: string) {
  return {
    from: fromId === undefined ? undefined : { id: fromId },
    message: text === undefined ? undefined : { text },
  };
}

describe('DevPersonaSwitch', () => {
  test('по умолчанию — первая персона (dev)', () => {
    const sw = new DevPersonaSwitch(DEV_TG);
    expect(sw.current.key).toBe('dev');
    expect(sw.current.telegramId).toBe(1004);
  });

  test('/persona без аргумента — список с текущей ролью', () => {
    const sw = new DevPersonaSwitch(DEV_TG);
    const reply = sw.handleCommand('/persona');
    expect(reply).toContain('Текущая роль: Dev');
    expect(reply).toContain('/persona marina');
    // роль не сменилась
    expect(sw.current.key).toBe('dev');
  });

  test('/persona <ключ> — переключение; домен дальше видит персону', () => {
    const sw = new DevPersonaSwitch(DEV_TG);
    const reply = sw.handleCommand('/persona oleg');
    expect(reply).toContain('Теперь ты — Олег');
    const ctx = ctxOf(DEV_TG);
    sw.applyFrom(ctx as never);
    expect(ctx.from?.id).toBe(sw.current.telegramId);
    expect(sw.current.telegramId).toBe(1008);
  });

  test('неизвестный ключ — подсказка, роль не меняется', () => {
    const sw = new DevPersonaSwitch(DEV_TG);
    const reply = sw.handleCommand('/persona nobody');
    expect(reply).toContain('Не знаю роль «nobody»');
    expect(sw.current.key).toBe('dev');
  });

  test('обычный текст — не команда (null), проходит в домен', () => {
    const sw = new DevPersonaSwitch(DEV_TG);
    expect(sw.handleCommand('Ментор спокойно разбирал ошибки')).toBeNull();
    expect(sw.handleCommand('/start')).toBeNull();
  });

  test('подмена from.id — только для dev-аккаунта', () => {
    const sw = new DevPersonaSwitch(DEV_TG);
    sw.handleCommand('/persona marina');
    const stranger = ctxOf(123_456);
    sw.applyFrom(stranger as never);
    expect(stranger.from?.id).toBe(123_456); // чужой tg не трогаем
  });

  test('wrapApi: sendMessage персонам уходит в dev-чат, прочие — как есть', async () => {
    const sw = new DevPersonaSwitch(DEV_TG);
    const sent: Array<{ chatId: number | string; text: string }> = [];
    const api = {
      sendMessage: async (chatId: number | string, text: string) => {
        sent.push({ chatId, text });
        return { message_id: 1 };
      },
    } as unknown as Api;

    const wrapped = sw.wrapApi(api);
    await wrapped.sendMessage(1007, 'приглашение Марине'); // персона
    await wrapped.sendMessage(1003, 'приглашение Андрею'); // персона
    await wrapped.sendMessage(777_777, 'реальному юзеру'); // не персона
    await wrapped.sendMessage('-100123', 'в группу'); // группа (строка)

    expect(sent.map((s) => s.chatId)).toEqual([
      DEV_TG,
      DEV_TG,
      777_777,
      '-100123',
    ]);
  });

  test('редирект покрывает всех персон (белый список)', () => {
    const sw = new DevPersonaSwitch(DEV_TG);
    for (const p of DEV_PERSONAS) {
      expect(sw.redirects.get(p.telegramId)).toBe(DEV_TG);
    }
    expect(sw.redirects.get(1005)).toBeUndefined(); // не персона
  });
});
