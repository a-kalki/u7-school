import { validateMarkdownV2 } from '@u7-scl/core/shared';
import type { BotResponse, SendMessageDescription } from '@u7-scl/core/ui';
import { InlineKeyboard } from 'grammy';
import type { BotContext } from './context';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Выполняет инструкции контроллера (отправка/редактирование сообщений).
 */
export async function executeResponses(ctx: BotContext, res: BotResponse) {
  // Dev-assert: проверка MarkdownV2 на неэкранированные символы
  // В продакшене пишет предупреждение в консоль, в тестах — assertResponseMarkdownSafe
  validateResponseInPlace(res);

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
      .editMessageText(ctx.chat?.id ?? 0, edit.messageId, edit.text, {
        reply_markup: keyboard,
        parse_mode: edit.parseMode,
      })
      .catch(() => {}); // Игнорируем ошибки если контент не изменился
  }

  // 1.5. По умолчанию убираем клавиатуру у предыдущего сообщения
  // Чтобы сохранить — установить keepPrevKeyboard: true
  if (res.keepPrevKeyboard !== true && ctx.session.lastBotMessage) {
    const prev = ctx.session.lastBotMessage;
    await ctx.api
      .editMessageText(ctx.chat?.id ?? 0, prev.messageId, prev.text, {
        reply_markup: undefined,
        parse_mode: prev.parseMode,
      })
      .catch(() => {});
    // Обновляем lastBotMessage: клавиатура больше не актуальна
    ctx.session.lastBotMessage = { ...prev, keyboard: undefined };
  }

  // 2. Затем отправляем новые сообщения
  const toSend = res.sendMessages ?? (res.sendMessage ? [res.sendMessage] : []);

  for (let i = 0; i < toSend.length; i++) {
    const send = toSend[i]!;
    const keyboard = send.keyboard
      ? new InlineKeyboard(
          send.keyboard.rows.map((row) =>
            row.map((btn) => ({ text: btn.text, callback_data: btn.code })),
          ),
        )
      : undefined;

    const sent = await ctx.reply(send.text, {
      reply_markup: keyboard,
      parse_mode: send.parseMode,
    });
    // А2: сохраняем последнее отправленное сообщение в сессию
    ctx.session.lastBotMessage = {
      text: send.text,
      keyboard: send.keyboard,
      parseMode: send.parseMode,
      messageId: sent.message_id,
    };

    // А4: задержка между сообщениями (кроме последнего)
    if (i < toSend.length - 1) {
      const delay = res.sendDelayMs ?? 1000;
      await sleep(delay);
    }
  }
}

// ── Dev-assert: валидация MarkdownV2 ──

/**
 * Проверяет все MarkdownV2-сообщения в ответе и пишет
 * предупреждение в консоль при обнаружении неэкранированных символов.
 */
function validateResponseInPlace(res: BotResponse): void {
  const msgs: SendMessageDescription[] = [];
  if (res.sendMessage) msgs.push(res.sendMessage);
  if (res.editMessage) msgs.push(res.editMessage);
  if (res.sendMessages) msgs.push(...res.sendMessages);

  for (const msg of msgs) {
    if (msg.parseMode === 'MarkdownV2' && msg.text) {
      const result = validateMarkdownV2(msg.text);
      if (!result.valid) {
        const details = result.issues
          .map(
            (i) =>
              `${i.reason === 'unescaped' ? 'неэкранированный' : 'непарный'} '${i.char}'`,
          )
          .join(', ');
        console.warn(
          `[MarkdownV2] ${result.issues.length} issue(s): ${details}`,
        );
        console.warn(`[MarkdownV2] text: ${msg.text.slice(0, 200)}`);
      }
    }
  }

  // delegate — не BotResponse, пропускаем
}
