import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { AppException } from '@u7-scl/core/domain';
import { type MdText, md, mdJoin } from '@u7-scl/core/shared';
import type { BotSession, BotUpdate, DialogResponse } from '@u7-scl/core/ui';
import type { MyRecipientsView } from '@u7-scl/peer-review/domain';
import { campaignProfileOf } from './campaign-profiles';
import type { MyReviewsStory } from './my-reviews.story';

/**
 * US: Кампания отзывов — карточка кампании и ввод отзыва
 * (S03 список адресатов → S05 ввод → S06 сохранение, S04 перезапись).
 *
 * Навигация (ui-spec 2026-09-22, живой прогон):
 * - в экран ввода попадают только из списка кампании → «откуда пришёл,
 *   туда вернёшься» выполняется без хранения referrer: родитель ввода —
 *   S03 (несколько адресатов) или хаб S02 (единственный адресат);
 * - единственный адресат — «выбор без выбора»: S03 не показываем,
 *   сразу экран ввода (S05 или S04, если об этом человеке уже написано);
 * - после сохранения — инфо-сообщение, затем новый экран-родитель;
 * - справка «Как писать отзыв» — инфо-сообщение без кнопок: экран ввода
 *   и ожидание текста не трогаются.
 *
 * Логика переходов собрана в явных методах-решениях (см. singleTargetOf,
 * #backAction, #afterSaveResponse) — не расплывается по коду.
 */
export class CampaignStory extends U7BotUiStory {
  readonly name = 'campaign';

  /**
   * Хаб «Мои отзывы» — рендер возврата при единственном адресате
   * (S03 у такой кампании не показывается, родитель — хаб).
   */
  constructor(private readonly hub?: MyReviewsStory) {
    super();
  }

  override async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    const [cmd, campaignId, third, fourth] = action.split(':');
    if (cmd === 'list' && campaignId) {
      // Суффикс p<n> — страница хаба-родителя: все возвраты ведут на неё
      return this.#showRecipients(campaignId, actor, parsePageSeg(third));
    }
    if (cmd === 'open' && campaignId && third) {
      return this.#askReview(campaignId, third, actor, parsePageSeg(fourth));
    }
    if (cmd === 'how' && campaignId && third) {
      // Инфо-сообщение без кнопок: экран и ожидание ввода не трогаем
      return this.notify(HOW_TO_REVIEW);
    }
    return this.unknownCommand(action, actor, session);
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
        md`✍️ Отзыв — от ${REVIEW_MIN_CHARS} символов\\. Напиши чуть подробнее\\.`,
      );
    }
    if (text.length > REVIEW_MAX_CHARS) {
      return this.warn(
        md`✍️ Спасибо за развёрнутость, но лимит — ${REVIEW_MAX_CHARS} символов\\. Пожалуйста, сократи отзыв\\.`,
      );
    }
    try {
      const before = await this.appApi.execute(
        'get-my-review',
        {
          campaignId: context.campaignId,
          authorId: actor.uuid,
          recipientId: context.recipientId,
        },
        actor,
      );
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
      const name =
        (await this.#namesOf([context.recipientId], actor)).get(
          context.recipientId,
        ) ?? '';
      // Инфо-сообщение о результате: новое сохранение или перезапись
      const verb = before.found ? 'обновлён' : 'отправлен';
      const notice = before.found
        ? md`✏️ Отзыв о ${name} обновлён\\.`
        : md`✅ Отзыв о ${name} сохранён\\.`;
      return this.#afterSaveResponse(
        saved.campaignId,
        actor,
        session,
        notice,
        await this.#saveFinalize(saved.campaignId, name, verb, actor),
        context.pageNumber,
      );
    } catch (err) {
      // Окно истекло пока писали — экран-заглушка (спека: возможности нет).
      // Финализация закрывает экран ввода, заглушка — новым сообщением
      // (после текста пользователя всё актуальное — внизу чата)
      if (
        err instanceof AppException &&
        err.error.name === 'REVIEW_WINDOW_CLOSED'
      ) {
        const name =
          (await this.#namesOf([context.recipientId], actor)).get(
            context.recipientId,
          ) ?? '';
        return {
          finalize: {
            text: md`⌛ Окно закрылось — отзыв о ${name} не отправлен\\.`,
          },
          ...this.screen(
            md`⌛ Возможность написать отзыв уже закрыта\\.`,
            this.kb([[this.#hubBtn(context.pageNumber)]]),
          ),
        };
      }
      // Прочие ошибки домена (чужой адресат и т.п.) — реплика поверх
      return this.errorNotify(err);
    }
  }

  /** S03: карточка кампании — контекст судьбы, прогресс, адресаты.
   * `page` — страница хаба-родителя: все возвраты ведут на неё. */
  async #showRecipients(
    campaignId: string,
    actor: User,
    page?: number,
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
      // кампания не жива/не моя — проверка РАНЬШЕ автопровала: истёкшее
      // окно с единственным адресатом не должно открывать ввод
      return this.screen(
        md`⚠️ Кампания не найдена\\.`,
        this.kb([[this.#hubBtn(page)]]),
      );
    }
    // «Выбор без выбора»: единственный адресат — список не показываем,
    // сразу экран ввода (подсказка S05 или перезапись S04)
    const single = singleTargetOf(view);
    if (single) {
      return this.#askReview(campaignId, single.userId, actor, page);
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
    const subjectName = (await this.#namesOf([card.subjectId], actor)).get(
      card.subjectId,
    );
    // Тексты вида кампании (судьба потока; будущие виды — свои профили)
    const profile = campaignProfileOf(view.context);

    const rows = view.recipients.map((r) => [
      this.btn(
        `${r.hasMyReview ? '✅' : ''}${profile.recipientLabel(recipientRoleOf(r.userId, view.mentorId), view.myRole)} — ${names.get(r.userId) ?? ''}`,
        pageSegCode(this.cb('open', campaignId, r.userId), page),
      ),
    ]);
    rows.push([this.#hubBtn(page)]);

    return this.screen(
      mdJoin([
        profile.listHeader(stream.title),
        md``,
        ...profile.listIntro(view.myRole, view.subjectOutcome, subjectName),
        md``,
        ...progressBlock(
          card.progress.done,
          card.progress.total,
          view.daysLeft,
        ),
        md``,
        md`О ком расскажешь?`,
      ]),
      this.kb(rows),
    );
  }

  /** S05/S04: ввод отзыва — подсказка или перезапись (✅-адресат).
   * `page` — страница хаба-родителя (проваливается в контекст ввода). */
  async #askReview(
    campaignId: string,
    recipientId: string,
    actor: User,
    page?: number,
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
        this.kb([[this.#hubBtn(page)]]),
      );
    }
    const name =
      (await this.#namesOf([recipientId], actor)).get(recipientId) ?? '';
    const title = await this.#streamTitleOf(campaignId, actor);
    // Тексты вида кампании: шапка-ориентир и подсказка
    const profile = campaignProfileOf(view.context);
    const header = profile.askHeader(title);
    const prompt = profile.askPrompt({
      myRole: view.myRole,
      recipientRole: recipientRoleOf(recipientId, view.mentorId),
      name,
      subjectOutcome: view.subjectOutcome,
    });
    const context: ReviewInputContext = {
      campaignId,
      recipientId,
      pageNumber: page,
    };
    // Назад — к родителю: список (>1 адресата) или хаб (единственный)
    const kb = this.kb([
      [this.#backAction(campaignId, view.recipients.length, page)],
      [
        this.btn(
          '❔ Как писать отзыв',
          this.cb('how', campaignId, recipientId),
        ),
      ],
    ]);
    if (!recipient.hasMyReview) {
      return this.ask(
        mdJoin([header, md``, prompt, md``, PRINCIPLES_BLOCK]),
        context,
        kb,
      );
    }

    // S04: адресат уже отозван — экран перезаписи с текущим текстом
    const my = await this.appApi.execute(
      'get-my-review',
      { campaignId, authorId: actor.uuid, recipientId },
      actor,
    );
    if (!my.found) {
      // рассинхрон признака (гонка) — обычный ввод S05
      return this.ask(
        mdJoin([header, md``, prompt, md``, PRINCIPLES_BLOCK]),
        context,
        kb,
      );
    }
    return this.ask(
      mdJoin([
        header,
        md``,
        md`✏️ Ты уже писал\\(а\\) о ${name}:`,
        md``,
        md`«${my.text ?? ''}»`,
        md``,
        md`Отправь новый текст — он заменит текущий\\.`,
        md`Или нажми «Назад»\\.`,
        md``,
        PRINCIPLES_BLOCK,
      ]),
      context,
      kb,
    );
  }

  /**
   * Финализация экрана ввода после сохранения — закрытие старого
   * сообщения (транспорт снимает клавиатуру, новый экран уходит новым
   * сообщением — актуальное всегда внизу чата).
   */
  async #saveFinalize(
    campaignId: string,
    name: string,
    verb: 'отправлен' | 'обновлён',
    actor: User,
  ): Promise<{ text: MdText }> {
    const title = await this.#streamTitleOf(campaignId, actor);
    return {
      text: md`✍️ *Отзыв — поток «${title}»* — отзыв о ${name} ${verb}\\.`,
    };
  }

  /**
   * Экран после сохранения — «откуда пришли в отзыв, туда и вернулись»:
   * несколько адресатов → список кампании S03 (обновлённые ✅ и метрики),
   * единственный → хаб S02 (список у такой кампании не показывается).
   * Инфо-сообщение о результате уходит первым, поверх нового экрана;
   * финализация закрывает экран ввода на его месте.
   */
  async #afterSaveResponse(
    campaignId: string,
    actor: User,
    session: BotSession,
    notice: MdText,
    finalize: { text: MdText },
    page?: number,
  ): Promise<DialogResponse> {
    const view = await this.appApi.execute(
      'get-campaign-recipients',
      { campaignId, authorId: actor.uuid },
      actor,
    );
    // session — в хаб: сброс кеша страниц после смены эпохи диалога
    // (обновлённый прогресс M/K на карточке); page — возврат на ту же
    // страницу хаба, с которой пришли в кампанию
    const parent =
      view.recipients.length > 1 || !this.hub
        ? await this.#showRecipients(campaignId, actor, page)
        : await this.hub.showHub(actor, session, page ?? 0);
    return { ...parent, notify: { text: notice }, finalize };
  }

  /** Кнопка «↩️ Мои отзывы» — родитель списка кампании.
   * `page` — страница хаба для возврата (0/undefined — обычный вход). */
  #hubBtn(page?: number) {
    return this.btn(
      '↩️ Мои отзывы',
      page && page > 0
        ? this.cbFor('my-reviews', 'hub-page', String(page))
        : this.cbFor('my-reviews', 'hub'),
    );
  }

  /**
   * Кнопка «↩️ Назад» с экранов ввода — к родителю по построению:
   * в ввод попадают только из списка кампании, поэтому при нескольких
   * адресатах родитель — S03; при единственном S03 не показывается,
   * родитель — хаб S02.
   */
  #backAction(campaignId: string, recipientsCount: number, page?: number) {
    return recipientsCount > 1
      ? this.btn('↩️ Назад', pageSegCode(this.cb('list', campaignId), page))
      : this.#hubBtn(page);
  }

  /** Название потока кампании — для шапки экранов ввода. */
  async #streamTitleOf(campaignId: string, actor: User): Promise<string> {
    const cards = await this.appApi.execute(
      'get-my-campaigns',
      { userId: actor.uuid },
      actor,
    );
    const card = cards.find((c) => c.campaignId === campaignId);
    if (!card) return '';
    const stream = await this.appApi.execute(
      'get-stream',
      { streamId: card.scopeId },
      actor,
    );
    return stream.title;
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

/**
 * Единственный адресат кампании («выбор без выбора»): список S03
 * не показываем — сразу экран ввода об этом человеке.
 */
function singleTargetOf(view: MyRecipientsView) {
  return view.recipients.length === 1 ? view.recipients[0] : undefined;
}

/** Сегмент страницы хаба для callback-кода (`p2`); 0/undefined — без суффикса. */
function pageSeg(page?: number): string | undefined {
  return page && page > 0 ? `p${page}` : undefined;
}

/** Callback-код с сегментом страницы хаба (все возвраты ведут на неё). */
function pageSegCode(code: string, page?: number): string {
  const seg = pageSeg(page);
  return seg ? `${code}:${seg}` : code;
}

/** Разбор сегмента `p<n>` из callback-кода: n или undefined. */
function parsePageSeg(seg?: string): number | undefined {
  if (!seg?.startsWith('p')) return undefined;
  const n = Number(seg.slice(1));
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

/** 📊 Прогресс — развёрнутые метрики S03 (каждая — своей строкой). */
function progressBlock(
  done: number,
  total: number,
  daysLeft: number,
): MdText[] {
  return [
    md`📊 *Прогресс:*`,
    md`• Написано отзывов: ${done} из ${total}`,
    md`• Осталось времени: ${daysLeft} дн\\.`,
  ];
}

/** Роль адресата — по составу кампании: ментор известен из payload (S03). */
function recipientRoleOf(
  recipientId: string,
  mentorId: string,
): 'student' | 'mentor' {
  return recipientId === mentorId ? 'mentor' : 'student';
}

/** Границы длины отзыва (спека S05). */
const REVIEW_MIN_CHARS = 10;
const REVIEW_MAX_CHARS = 3500;

/** Контекст ввода отзыва (живёт в dialog.input.context).
 * `pageNumber` — страница хаба-родителя: возврат после сохранения туда же. */
interface ReviewInputContext {
  campaignId: string;
  recipientId: string;
  pageNumber?: number;
}

/** Принципы полезного отзыва — общий блок экранов ввода (S05/S04). */
const PRINCIPLES_BLOCK: MdText = md`Будь честен, пиши правду\\. Характеризуй навыки, а не людей: лучше описать конкретную ситуацию и свои ощущения, чем повесить ярлык\\. Такой отзыв приносит пользу\\.`;

/**
 * S05i: справка «Как писать отзыв» — инфо-сообщение без кнопок
 * (ui-spec 2026-09-22; примеры обезличены). Экран ввода остаётся активным —
 * финальная строка напоминает об этом.
 */
const HOW_TO_REVIEW: MdText = mdJoin([
  md`❔ *Как писать отзыв*`,
  md``,
  md`Отзыв полезен, когда говорит о навыках и конкретных ситуациях — а не о людях\\.`,
  md``,
  md`🌱 *Сначала — сильные стороны*`,
  md`Начинай с того, что получилось и в чём человек силён, а потом — что стоит подтянуть\\. Такой отзыв легче принять и полезнее читать\\.`,
  md`✅ «Мне не раз приходилось работать с Андреем в сессиях парного программирования\\. Он всегда был в фокусе происходящего, предлагал ценные идеи и хорошо разбивал логику задачи на этапы\\. Бывает категоричен — отстоять другую точку зрения сложно, но в паре это же помогало быстрее приходить к решениям\\.»`,
  md``,
  md`🎯 *Пиши своё*`,
  md`Ты не обязан писать по шаблону\\. Скажи то, что важно именно тебе: с желанием помочь человеку расти и подсказать другим, как с ним работается\\. Это и есть цель отзыва — всё остальное лишь средства\\.`,
  md``,
  md`🧩 *Пиши о навыках и фактах*`,
  md`Опирайся на наблюдаемое: что человек делал, как часто, с каким результатом\\.`,
  md`❌ «Андрей безответственный\\.»`,
  md`✅ «Андрей дважды переносил дедлайн на 2–3 дня, и команде приходилось ждать\\.»`,
  md``,
  md`💡 *Пиши о ситуациях и ощущениях*`,
  md`Конкретный случай и как тебе было — честнее и понятнее общих оценок\\.`,
  md`Положительный опыт:`,
  md`✅ «Когда я застрял на алгоритмах, Марина объяснила подход на примере — за 20 минут стало ясно, куда двигаться\\.»`,
  md`Отрицательный опыт:`,
  md`✅ «Мне было тяжело ждать код\\-ревью по 3 дня: не успевал исправлять до следующего шага\\.»`,
  md``,
  md`🚫 *Ярлык и переход на личности*`,
  md`Ярлык — короткая оценка всего человека: «ленивый», «токсичный», «бестолковый»\\. Переход на личности — суждение о том, какой он, а не о том, что он делал\\. Такому сложно верить и невозможно проверить\\.`,
  md``,
  md`🔄 *Как превратить ярлык в полезный отзыв*`,
  md`1\\. Заметь поведение: что конкретно происходило?`,
  md`2\\. Скажи, как это повлияло на тебя или команду\\.`,
  md`3\\. Добавь пожелание, если оно есть\\.`,
  md`«Он токсичный» → «На созвонах разговор часто уходил в споры, из\\-за этого я молчал и не предлагал идеи\\. Было бы легче договориться о формате заранее\\.»`,
  md``,
  md`Пиши правду — только она приносит пользу\\.`,
  md``,
  md`✍️ Экран ввода остаётся активным — просто напиши отзыв следующим сообщением\\.`,
]);
