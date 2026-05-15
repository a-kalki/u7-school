import { createConversation } from '@grammyjs/conversations';
import type { OnboardingController } from '@u7/onboarding';
import type { Bot } from 'grammy';
import { InlineKeyboard } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';

/**
 * Conversation прохождения onboarding-анкеты.
 */
function onboardingConversation(
  controller: OnboardingController,
  config: BotConfig,
) {
  return async function conversation(conv: any, ctx: BotContext) {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply('Не удалось определить пользователя.');
      return;
    }

    // Начинаем анкету
    const { questionnaireUuid, firstQuestion } = await conv.external(() =>
      controller.restartQuestionnaire(String(telegramId), config.botAdminUuid),
    );

    ctx.session.questionnaireUuid = questionnaireUuid;
    ctx.session.selectedAnswers = {};

    let currentQuestion = firstQuestion;

    while (currentQuestion) {
      const question = currentQuestion;
      if (!question) break;

      if (question.type === 'choice') {
        const selected: string[] =
          ctx.session.selectedAnswers?.[question.questionCode] ?? [];
        const keyboardDesc = controller.getKeyboard(question, selected);

        if (!keyboardDesc) {
          await ctx.reply('Ошибка: не удалось построить клавиатуру.');
          return;
        }

        const inlineKeyboard = new InlineKeyboard();
        for (const row of keyboardDesc.rows) {
          for (const btn of row) {
            inlineKeyboard.text(btn.text, btn.code);
          }
          inlineKeyboard.row();
        }
        if (keyboardDesc.isMultiple) {
          inlineKeyboard.text('Далее ➡️', 'next');
        }

        await ctx.reply(question.question, {
          reply_markup: inlineKeyboard,
        });

        let value: string | string[];

        if (keyboardDesc.isMultiple) {
          // Множественный выбор
          while (true) {
            const callbackCtx = await conv.waitFor('callback_query:data');
            const data = callbackCtx.callbackQuery?.data;
            await callbackCtx.answerCallbackQuery();

            if (data === 'next') {
              value =
                ctx.session.selectedAnswers?.[question.questionCode] ?? [];
              break;
            }

            if (!data) continue;

            // Toggle выбор
            const currentSelected: string[] =
              ctx.session.selectedAnswers?.[question.questionCode] ?? [];
            const idx: number = currentSelected.indexOf(data);
            const nextSelected: string[] =
              idx >= 0
                ? currentSelected.filter((c: string) => c !== data)
                : [...currentSelected, data];

            ctx.session.selectedAnswers = {
              ...ctx.session.selectedAnswers,
              [question.questionCode]: nextSelected,
            };

            // Обновляем клавиатуру
            const updatedDesc = controller.getKeyboard(question, nextSelected);
            if (updatedDesc) {
              const updatedKeyboard = new InlineKeyboard();
              for (const row of updatedDesc.rows) {
                for (const btn of row) {
                  updatedKeyboard.text(btn.text, btn.code);
                }
                updatedKeyboard.row();
              }
              updatedKeyboard.text('Далее ➡️', 'next');
              await callbackCtx.editMessageReplyMarkup({
                reply_markup: updatedKeyboard,
              });
            }
          }
        } else {
          // Одиночный выбор
          const callbackCtx = await conv.waitFor('callback_query:data');
          await callbackCtx.answerCallbackQuery();
          value = callbackCtx.callbackQuery?.data ?? '';
        }

        const result = await conv.external(() =>
          controller.submitAnswer(
            questionnaireUuid,
            question.questionCode,
            value,
            config.botAdminUuid,
          ),
        );

        if (result.isCompleted) {
          break;
        }

        currentQuestion = result.nextQuestion;
      } else if (question.type === 'text') {
        await ctx.reply(question.question);

        const msgCtx = await conv.waitFor('message:text');
        const value = msgCtx.msg?.text ?? '';

        const result = await conv.external(() =>
          controller.submitAnswer(
            questionnaireUuid,
            question.questionCode,
            value,
            config.botAdminUuid,
          ),
        );

        if (result.isCompleted) {
          break;
        }

        currentQuestion = result.nextQuestion;
      } else {
        await ctx.reply('Неизвестный тип вопроса.');
        break;
      }
    }

    // Анкета завершена
    ctx.session.questionnaireUuid = undefined;
    ctx.session.selectedAnswers = {};

    await ctx.reply(
      `Спасибо! Твоя заявка принята ✅\n\nПрисоединяйся к группе:\n${config.newsGroupUrl}`,
      {
        reply_markup: new InlineKeyboard().text('Вернуться в меню', 'menu'),
      },
    );
  };
}

/**
 * Регистрирует onboarding conversation в боте.
 */
export function registerOnboardingConversation(
  bot: Bot<BotContext>,
  controller: OnboardingController,
  config: BotConfig,
) {
  bot.use(
    createConversation(
      onboardingConversation(controller, config),
      'onboarding',
    ),
  );
}
