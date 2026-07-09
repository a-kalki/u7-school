import { describe, expect, mock, test } from 'bun:test';
import type { TgFacade } from '@u7-scl/stream/domain';
import { TelegramTgFacade } from './telegram-tg-facade';

describe('TelegramTgFacade', () => {
  /** Создаёт подставной Grammy Bot API и TgFacade */
  function createFacade(): {
    facade: TgFacade;
    sendMessageMock: ReturnType<typeof mock>;
  } {
    const sendMessageMock = mock(async (_chatId: number, _text: string) => {
      // resolve silently
    });

    const botApi = { sendMessage: sendMessageMock };
    const bot = { api: botApi } as unknown as {
      api: { sendMessage: typeof sendMessageMock };
    };

    const facade = new TelegramTgFacade(bot);
    return { facade, sendMessageMock };
  }

  describe('sendMessage', () => {
    test('вызывает bot.api.sendMessage с правильными параметрами', async () => {
      const { facade, sendMessageMock } = createFacade();

      await facade.sendMessage(12345, 'Привет, студент!');

      expect(sendMessageMock).toHaveBeenCalledTimes(1);
      expect(sendMessageMock).toHaveBeenCalledWith(12345, 'Привет, студент!');
    });

    test('прокидывает ошибку от Grammy API', async () => {
      const { facade, sendMessageMock } = createFacade();
      sendMessageMock.mockRejectedValueOnce(new Error('Telegram API error'));

      await expect(
        facade.sendMessage(12345, 'test'),
      ).rejects.toThrow('Telegram API error');
    });
  });

  describe('sendBatch', () => {
    test('отправляет сообщение каждому из списка telegramIds', async () => {
      const { facade, sendMessageMock } = createFacade();

      await facade.sendBatch([111, 222, 333], 'Всем привет!');

      expect(sendMessageMock).toHaveBeenCalledTimes(3);
      expect(sendMessageMock).toHaveBeenNthCalledWith(1, 111, 'Всем привет!');
      expect(sendMessageMock).toHaveBeenNthCalledWith(2, 222, 'Всем привет!');
      expect(sendMessageMock).toHaveBeenNthCalledWith(3, 333, 'Всем привет!');
    });

    test('не падает если список пустой', async () => {
      const { facade, sendMessageMock } = createFacade();

      await facade.sendBatch([], 'Никто не получит');

      expect(sendMessageMock).toHaveBeenCalledTimes(0);
    });
  });
});
