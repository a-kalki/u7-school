import type { BotResponse } from '@u7-scl/core/ui';
import { InlineKeyboard } from 'grammy';
import type { BotContext } from './context';

/**
 * Выполняет инструкции контроллера (отправка/редактирование сообщений).
 */
export async function executeResponses(ctx: BotContext, res: BotResponse) {
  // 1. Сначала редактируем, если нужно
  if (res.editMessage) {
    const edit = res.editMessage;
    const keyboard = edit.keyboard
      ? new InlineKeyboard(
          edit.keyboard.rows.map((row) =>
            row.map((btn) => ({ text: btn.text, callback_data: btn.code })),
          ),
        )
      : undefined;

    await ctx.api
      .editMessageText(ctx.chat?.id, edit.messageId, edit.text, {
        reply_markup: keyboard,
        parse_mode: edit.parseMode,
      })
      .catch(() => {}); // Игнорируем ошибки если контент не изменился
  }

  // 2. Затем отправляем новое
  if (res.sendMessage) {
    const send = res.sendMessage;
    const keyboard = send.keyboard
      ? new InlineKeyboard(
          send.keyboard.rows.map((row) =>
            row.map((btn) => ({ text: btn.text, callback_data: btn.code })),
          ),
        )
      : undefined;

    await ctx.reply(send.text, {
      reply_markup: keyboard,
      parse_mode: send.parseMode,
    });
  }
}
