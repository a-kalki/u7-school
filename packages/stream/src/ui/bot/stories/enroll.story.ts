import type { User } from '@u7-scl/app/domain';
import { U7BotUserStory } from '@u7-scl/app/ui';
import type { BotResponse, BotUpdate, SessionData } from '@u7-scl/core/ui';
import type { StreamApiModuleMeta } from '../../../domain/module';

const MAX_ATTEMPTS = 3;

interface EnrollKeyContext {
  streamId: string;
  enrollmentKey: string;
  attempts: number;
}

/**
 * US-3: Запись на поток (Регистрация).
 * US-10: Проверка кодового слова (если задано).
 */
export class EnrollStory extends U7BotUserStory<StreamApiModuleMeta> {
  readonly name = 'enroll';

  async handleCallback(
    action: string,
    actor: User,
    _session: SessionData,
  ): Promise<BotResponse> {
    // Отмена ввода кодового слова
    if (action.startsWith('cancel:')) {
      const [, streamId] = action.split(':');
      return {
        releaseInput: true,
        delegate: { path: `view-stream:view:${streamId}` },
      };
    }

    const [cmd, streamId] = action.split(':');
    if (cmd !== 'enroll' || !streamId) {
      return { sendMessage: { text: '⚠️ Неизвестная команда' } };
    }

    // Получаем поток для проверки enrollmentKey
    const stream = await this.moduleApi.execute('get-stream', { streamId });

    // Если есть кодовое слово — запрашиваем его у студента
    if (stream.enrollmentKey) {
      return {
        sendMessage: {
          text: '🔑 Введите кодовое слово для записи на поток:',
          keyboard: {
            rows: [
              [
                {
                  text: '❌ Отмена',
                  code: this.cb(`cancel:${streamId}`),
                },
              ],
            ],
            isMultiple: false,
          },
        },
        captureInput: {
          path: 'enroll/enroll-key',
          context: {
            streamId,
            enrollmentKey: stream.enrollmentKey,
            attempts: 0,
          } satisfies EnrollKeyContext,
        },
      };
    }

    // Без кодового слова — сразу зачисляем
    return this.#doEnroll(streamId, actor);
  }

  async handleMessage(
    update: BotUpdate,
    actor: User,
    session: SessionData,
  ): Promise<BotResponse> {
    if (update.type !== 'message') {
      return { sendMessage: { text: '⚠️ Ожидалось текстовое сообщение' } };
    }

    const ctx = session.activeHandler?.context as EnrollKeyContext | undefined;
    if (!ctx) {
      return { sendMessage: { text: '⚠️ Контекст потерян' } };
    }

    const enteredKey = update.text;

    if (enteredKey !== ctx.enrollmentKey) {
      const attemptsLeft = MAX_ATTEMPTS - ctx.attempts - 1;
      if (attemptsLeft <= 0) {
        return {
          releaseInput: true,
          sendMessage: {
            text: `❌ Попытки исчерпаны.\nВозврат к потоку — нажмите кнопку ниже.`,
            keyboard: {
              rows: [
                [
                  {
                    text: '⬅️ Назад к потоку',
                    code: `view-stream:view:${ctx.streamId}`,
                  },
                ],
              ],
              isMultiple: false,
            },
          },
        };
      }

      return {
        sendMessage: {
          text: `❌ Неверное слово. Осталось попыток: ${attemptsLeft}`,
          keyboard: {
            rows: [
              [
                {
                  text: '❌ Отмена',
                  code: this.cb(`cancel:${ctx.streamId}`),
                },
              ],
            ],
            isMultiple: false,
          },
        },
        captureInput: {
          path: 'enroll/enroll-key',
          context: {
            ...ctx,
            attempts: ctx.attempts + 1,
          } satisfies EnrollKeyContext,
        },
      };
    }

    // Верное слово — зачисляем с enrollmentKey
    return this.#doEnroll(ctx.streamId, actor, ctx.enrollmentKey);
  }

  async #doEnroll(
    streamId: string,
    actor: User,
    enrollmentKey?: string,
  ): Promise<BotResponse> {
    const stream = await this.moduleApi.execute('get-stream', { streamId });

    await this.moduleApi.execute(
      'enroll-student',
      {
        streamId,
        userId: actor.uuid,
        enrollmentKey,
      },
      actor.uuid,
    );

    const dateStr = this.formatDate(stream.startDate);
    const lines = [
      '🎉 *Вы успешно записаны на поток\\!*',
      '',
      `📋 _${this.escapeMarkdown(stream.title)}_`,
      `📅 Обучение начнётся: ${this.escapeMarkdown(dateStr)}`,
    ];

    if (stream.telegramGroupInvite) {
      lines.push('', `🔗 ${this.escapeMarkdown(stream.telegramGroupInvite)}`);
    }

    return {
      sendMessage: {
        text: lines.join('\n'),
        parseMode: 'MarkdownV2',
      },
      delegate: { path: 'learning:my-study' },
    };
  }

  override async handleStart(_actor: User): Promise<null> {
    return null;
  }
}
