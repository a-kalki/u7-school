import { createConversation } from '@grammyjs/conversations';
import type { OnboardingController } from '@u7/onboarding';
import type { Question } from '@u7/onboarding/domain';
import type { Bot } from 'grammy';
import { InlineKeyboard } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';

/** Экранирует спецсимволы Telegram MarkdownV2 */
function escapeMd(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

/**
 * Форматирует вопрос с вариантами ответов в MarkdownV2.
 * Вопрос жирным, выбранные варианты — `*[x]*`, невыбранные — `[ ]`.
 */
function formatQuestionMd(question: Question, selected?: string[]): string {
  if (question.type !== 'choice') {
    return `*${escapeMd(question.question)}*`;
  }
  const lines: string[] = [`*${escapeMd(question.question)}*`, ''];
  question.answers.forEach((a, i) => {
    const marker = selected?.includes(a.answerCode) ? '*\\[x\\]*' : '\\[ \\]';
    lines.push(`${marker} ${i + 1}\\. ${escapeMd(a.answer)}`);
  });
  return lines.join('\n');
}

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
    let questionnaireUuid: string;
    let currentQuestion: Question | null = null;
    try {
      const result = await conv.external(() =>
        controller.restartQuestionnaire(
          String(telegramId),
          config.botAdminUuid,
        ),
      );
      questionnaireUuid = result.questionnaireUuid;
      currentQuestion = result.firstQuestion;
    } catch (err) {
      await ctx.reply(
        `Ошибка при создании анкеты: ${(err as Error).message || err}`,
      );
      return;
    }

    // Инструкция
    await ctx.reply(
      escapeMd(
        'Ответьте на вопросы.\n\nВы в любой момент можете прервать опрос, набрав `/cancel`. В этом случае вы сможете позже пройти опрос заново.',
      ),
      { parse_mode: 'MarkdownV2' },
    );

    const selectedAnswers: Record<string, string[]> = {};

    while (currentQuestion) {
      const question = currentQuestion;

      if (question.type === 'choice') {
        const selected: string[] = selectedAnswers[question.questionCode] ?? [];
        const keyboardDesc = controller.getKeyboard(question, selected);

        if (!keyboardDesc) {
          await ctx.reply('Ошибка: не удалось построить клавиатуру.');
          return;
        }

        const allButtons = keyboardDesc.rows.flat();
        const questionMd = formatQuestionMd(question, selected);

        if (keyboardDesc.isMultiple) {
          // --- МНОЖЕСТВЕННЫЙ ВЫБОР ---
          const inlineKeyboard = new InlineKeyboard();
          for (const btn of allButtons) inlineKeyboard.text(btn.text, btn.code);
          inlineKeyboard.row();
          if (selected.length > 0) inlineKeyboard.text('-->', 'next');

          await ctx.reply(questionMd, {
            reply_markup: inlineKeyboard,
            parse_mode: 'MarkdownV2',
          });

          while (true) {
            const cq = await conv.waitFor('callback_query:data');
            const data = cq.callbackQuery?.data;
            await cq.answerCallbackQuery();

            if (data === 'next') {
              try {
                const result = await conv.external(() =>
                  controller.submitAnswer(
                    questionnaireUuid,
                    question.questionCode,
                    selectedAnswers[question.questionCode] ?? [],
                    config.botAdminUuid,
                  ),
                );
                if (result.isCompleted) {
                  await sendCompletion(ctx, config);
                  return;
                }
                currentQuestion = result.nextQuestion;
              } catch (err) {
                await ctx.reply(
                  `Ошибка: ${(err as Error).message || 'Неизвестная ошибка'}`,
                );
                // Не выходим — остаёмся в том же вопросе
              }
              break; // выходим из внутреннего while, внешний перепокажет вопрос
            }

            if (!data) continue;

            // Toggle
            const cur: string[] = selectedAnswers[question.questionCode] ?? [];
            const idx = cur.indexOf(data);
            const next =
              idx >= 0 ? cur.filter((c) => c !== data) : [...cur, data];
            selectedAnswers[question.questionCode] = next;

            const updText = formatQuestionMd(question, next);
            const updKbd = new InlineKeyboard();
            for (const btn of allButtons) updKbd.text(btn.text, btn.code);
            updKbd.row();
            if (next.length > 0) updKbd.text('-->', 'next');

            await cq.editMessageText(updText, {
              reply_markup: updKbd,
              parse_mode: 'MarkdownV2',
            });
          }
        } else {
          // --- ОДИНАРНЫЙ ВЫБОР ---
          const inlineKeyboard = new InlineKeyboard();
          for (const btn of allButtons) inlineKeyboard.text(btn.text, btn.code);

          const sent = await ctx.reply(questionMd, {
            reply_markup: inlineKeyboard,
            parse_mode: 'MarkdownV2',
          });

          while (true) {
            const cq = await conv.waitFor('callback_query:data');
            const value = cq.callbackQuery?.data ?? '';
            await cq.answerCallbackQuery();

            if (!value) continue;

            // Подсветить выбор маркером *[x]*
            const answerIndex = parseInt(value, 10) - 1;
            if (answerIndex >= 0 && answerIndex < question.answers.length) {
              const selCode = [question.answers[answerIndex]!.answerCode];
              const selectedText = formatQuestionMd(question, selCode);
              await ctx.api.editMessageText(
                sent.chat.id,
                sent.message_id,
                selectedText,
                { parse_mode: 'MarkdownV2' },
              );
            }

            try {
              const result = await conv.external(() =>
                controller.submitAnswer(
                  questionnaireUuid,
                  question.questionCode,
                  value,
                  config.botAdminUuid,
                ),
              );
              if (result.isCompleted) {
                await sendCompletion(ctx, config);
                return;
              }
              currentQuestion = result.nextQuestion;
              break;
            } catch (err) {
              await ctx.reply(
                `Ошибка: ${(err as Error).message || 'Неизвестная ошибка'}`,
              );
              // Перепоказываем вопрос
              await ctx.reply(questionMd, {
                reply_markup: inlineKeyboard,
                parse_mode: 'MarkdownV2',
              });
            }
          }
        }
      } else if (question.type === 'text') {
        // --- ТЕКСТОВЫЙ ВОПРОС ---
        await ctx.reply(escapeMd(question.question), {
          parse_mode: 'MarkdownV2',
        });

        while (true) {
          const msgCtx = await conv.waitFor('message:text');
          const value = msgCtx.msg?.text ?? '';

          if (!value.trim()) {
            await ctx.reply('Пожалуйста, введите ответ.');
            continue;
          }

          try {
            const result = await conv.external(() =>
              controller.submitAnswer(
                questionnaireUuid,
                question.questionCode,
                value,
                config.botAdminUuid,
              ),
            );
            if (result.isCompleted) {
              await sendCompletion(ctx, config);
              return;
            }
            currentQuestion = result.nextQuestion;
            break;
          } catch (err) {
            await ctx.reply(
              `Ошибка: ${(err as Error).message || 'Неизвестная ошибка'}`,
            );
          }
        }
      } else {
        await ctx.reply('Неизвестный тип вопроса.');
        break;
      }
    }
  };
}

async function sendCompletion(ctx: BotContext, config: BotConfig) {
  const text = [
    escapeMd('Спасибо! Твоя заявка принята.'),
    '',
    escapeMd(
      'Присоединяйся к группе — там ты узнаешь, чем мы живём и что происходит у других студентов:',
    ),
    escapeMd(config.newsGroupUrl),
  ].join('\n');

  await ctx.reply(text, {
    reply_markup: new InlineKeyboard().text('Вернуться в меню', 'menu'),
    parse_mode: 'MarkdownV2',
  });
}

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
