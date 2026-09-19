import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { type MdText, md, mdJoin } from '@u7-scl/core/shared';
import type { BotSession, BotUpdate, DialogResponse } from '@u7-scl/core/ui';
import { buttons } from '../../shared/buttons';

/**
 * US: Кампания отзывов — S03 список адресатов (ввод S04–S06 — следующими
 * задачами трека peer-review-ui).
 *
 * Вход: `list:<campaignId>` — из приглашения (S01) или хаба «Отзывы» (S02).
 * Адресация и ✅-признак считаются доменом (`get-campaign-recipients`);
 * сторя добывает название потока (карточка кампании → get-stream) и имена
 * адресатов (get-user) для подписей кнопок.
 */
export class CampaignStory extends U7BotUiStory {
  readonly name = 'campaign';

  override async handleCallback(
    action: string,
    actor: User,
    _session: BotSession,
  ): Promise<DialogResponse> {
    const [cmd, campaignId, recipientId] = action.split(':');
    if (cmd === 'list' && campaignId) {
      return this.#showRecipients(campaignId, actor);
    }
    if (cmd === 'open' && campaignId && recipientId) {
      return this.#askReview(campaignId, recipientId, actor);
    }
    if (cmd === 'skip' && campaignId) {
      return this.#showRecipients(campaignId, actor);
    }
    return this.unknownCommand(action, actor, _session);
  }

  override async handleMessage(
    update: BotUpdate,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    const context = session.dialog?.input?.context as
      | ReviewInputContext
      | undefined;
    if (!context) {
      return this.screen(md`⚠️ Неизвестное сообщение`);
    }
    const text = update.type === 'message' ? update.text : '';
    if (text.length < REVIEW_MIN_CHARS) {
      return this.warn(
        md`✍️ Отзыв — от ${REVIEW_MIN_CHARS} символов\\. Напишите чуть подробнее\\.`,
      );
    }
    if (text.length > REVIEW_MAX_CHARS) {
      return this.warn(
        md`✍️ Спасибо за развёрнутость, но лимит — ${REVIEW_MAX_CHARS} символов\\. Пожалуйста, сократите отзыв\\.`,
      );
    }
    try {
      const saved = await this.appApi.execute(
        'create-review',
        {
          campaignId: context.campaignId,
          authorId: actor.uuid,
          recipientId: context.recipientId,
          text,
        },
        actor,
      );
      return this.#showRecipients(saved.campaignId, actor, saved.recipientId);
    } catch (err) {
      // Ошибки домена (окно закрыто, чужой адресат и т.п.) — реплика поверх
      return this.errorNotify(err);
    }
  }

  /** S03: список адресатов кампании; ✅ — мой отзыв уже есть. */
  async #showRecipients(
    campaignId: string,
    actor: User,
    savedId?: string,
  ): Promise<DialogResponse> {
    const view = await this.appApi.execute(
      'get-campaign-recipients',
      { campaignId, authorId: actor.uuid },
      actor,
    );
    const cards = await this.appApi.execute(
      'get-my-campaigns',
      { userId: actor.uuid },
      actor,
    );
    const card = cards.find((c) => c.campaignId === campaignId);
    if (!card) {
      return this.screen(
        md`⚠️ Кампания не найдена\\.`,
        this.kb([[buttons.mainMenu()]]),
      );
    }
    const stream = await this.appApi.execute(
      'get-stream',
      { streamId: card.scopeId },
      actor,
    );
    const names = await this.#namesOf(
      view.recipients.map((r) => r.userId),
      actor,
    );

    const rows = view.recipients.map((r) => [
      this.btn(
        `${r.hasMyReview ? '✅ ' : ''}${recipientLabel(r.role)}: ${names.get(r.userId) ?? ''}`,
        this.cb('open', campaignId, r.userId),
      ),
    ]);
    rows.push([buttons.mainMenu()]);

    // S06: после сохранения — другой заголовок, с именем адресата
    const header = savedId
      ? md`✅ Отзыв о ${names.get(savedId) ?? ''} сохранён\\. О ком ещё рассказать?`
      : md`✍️ Поток «${stream.title}»\\. О ком хотите рассказать? Пишите кому хотите и сколько хотите\\.`;
    return this.screen(
      mdJoin([header, md`⏳ Возможность открыта ещё ${view.daysLeft} дн\\.`]),
      this.kb(rows),
    );
  }

  /** S05/S04: ввод отзыва — обычная подсказка или перезапись (✅-адресат). */
  async #askReview(
    campaignId: string,
    recipientId: string,
    actor: User,
  ): Promise<DialogResponse> {
    const view = await this.appApi.execute(
      'get-campaign-recipients',
      { campaignId, authorId: actor.uuid },
      actor,
    );
    const recipient = view.recipients.find((r) => r.userId === recipientId);
    if (!recipient) {
      return this.screen(
        md`⚠️ Адресат недоступен\\.`,
        this.kb([[buttons.mainMenu()]]),
      );
    }
    const name =
      (await this.#namesOf([recipientId], actor)).get(recipientId) ?? '';
    const prompt = reviewPrompt(
      view.myRole,
      view.myOutcome,
      recipient.role,
      name,
    );
    const context: ReviewInputContext = { campaignId, recipientId };
    const kb = this.kb([
      [this.btn('⏭️ Пропустить', this.cb('skip', campaignId))],
    ]);
    if (!recipient.hasMyReview) {
      return this.ask(prompt, context, kb);
    }

    // S04: адресат уже отозван — экран перезаписи с текущим текстом
    const my = await this.appApi.execute(
      'get-my-review',
      { campaignId, authorId: actor.uuid, recipientId },
      actor,
    );
    if (!my.found) {
      // рассинхрон признака (гонка) — обычный ввод S05
      return this.ask(prompt, context, kb);
    }
    return this.ask(
      mdJoin([
        md`✏️ Вы уже писали о ${name}:`,
        md``,
        md`«${my.text ?? ''}»`,
        md``,
        md`Отправьте новый текст — он заменит текущий\\.`,
        md`Или нажмите «Назад»\\.`,
      ]),
      context,
      this.kb([[this.btn('❌ Назад', this.cb('skip', campaignId))]]),
    );
  }

  /** Имена адресатов для подписей кнопок. */
  async #namesOf(userIds: string[], actor: User): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    for (const userId of userIds) {
      const user = await this.appApi.execute(
        'get-user',
        { uuid: userId },
        actor,
      );
      names.set(userId, user.name);
    }
    return names;
  }
}

/** Подпись роли адресата в кнопке S03. */
function recipientLabel(role: 'student' | 'mentor'): string {
  return role === 'mentor' ? 'Ментор' : 'Студент';
}

/** Границы длины отзыва (спека S05). */
const REVIEW_MIN_CHARS = 10;
const REVIEW_MAX_CHARS = 3500;

/** Контекст ввода отзыва (живёт в dialog.input.context). */
interface ReviewInputContext {
  campaignId: string;
  recipientId: string;
}

type AuthorOutcome = 'completed' | 'in_progress' | 'dropped' | 'never_started';

/** Текст-подсказка S05 — по направлению и исходу автора (ui-spec S05). */
function reviewPrompt(
  myRole: 'subject' | 'mentor',
  myOutcome: AuthorOutcome | undefined,
  recipientRole: 'student' | 'mentor',
  name: string,
): MdText {
  if (recipientRole === 'student') {
    if (myRole === 'mentor') {
      return md`Расскажите о студенте ${name}: сильные стороны, чего удалось достичь за поток, что стоит подтянуть\\.`;
    }
    return md`Расскажите о ${name}\\. Как бы вы описали его профессиональные, командные и личностные качества? Не обязательно перечислять всё — пишите только то, что хотите написать, и пишите правду\\. Если считаете, что что\\-то стоит подтянуть, — напишите и об этом\\.`;
  }
  if (myOutcome === 'never_started') {
    return md`Почему так и не начали учёбу? Что не совпало с ожиданиями? Ваши впечатления о менторе и школе помогут тем, кто только выбирает\\.`;
  }
  if (myOutcome === 'dropped') {
    return md`Почему забросили учёбу? Какие пожелания оставите школе и ментору? Что стоит ожидать людям, которые рассматривают возможность здесь учиться\\.`;
  }
  // «завершил» и учившийся на момент закрытия потока (in_progress)
  return md`Поделитесь впечатлением о работе с ментором ${name}: что помогало учиться, что мешало, чего не хватило\\. Пишите правду — это поможет и ментору, и школе\\.`;
}
