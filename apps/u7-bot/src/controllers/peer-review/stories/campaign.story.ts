import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { AppException } from '@u7-scl/core/domain';
import { type MdText, md, mdJoin } from '@u7-scl/core/shared';
import type { BotSession, BotUpdate, DialogResponse } from '@u7-scl/core/ui';
import type { MyRecipientsView } from '@u7-scl/peer-review/domain';
import { buttons } from '../../shared/buttons';
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
    const [cmd, campaignId, recipientId] = action.split(':');
    if (cmd === 'list' && campaignId) {
      return this.#showRecipients(campaignId, actor);
    }
    if (cmd === 'open' && campaignId && recipientId) {
      return this.#askReview(campaignId, recipientId, actor);
    }
    if (cmd === 'how' && campaignId && recipientId) {
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
      const notice = before.found
        ? md`✏️ Отзыв о ${name} обновлён\\.`
        : md`✅ Отзыв о ${name} сохранён\\.`;
      return this.#afterSaveResponse(saved.campaignId, actor, notice);
    } catch (err) {
      // Окно истекло пока писали — экран-заглушка (спека: возможности нет)
      if (
        err instanceof AppException &&
        err.error.name === 'REVIEW_WINDOW_CLOSED'
      ) {
        return this.screen(
          md`⌛ Возможность написать отзыв уже закрыта\\.`,
          this.kb([[this.#hubBtn()]]),
        );
      }
      // Прочие ошибки домена (чужой адресат и т.п.) — реплика поверх
      return this.errorNotify(err);
    }
  }

  /** S03: карточка кампании — контекст судьбы, прогресс, адресаты. */
  async #showRecipients(
    campaignId: string,
    actor: User,
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
        this.kb([[this.#hubBtn()]]),
      );
    }
    // «Выбор без выбора»: единственный адресат — список не показываем,
    // сразу экран ввода (подсказка S05 или перезапись S04)
    const single = singleTargetOf(view);
    if (single) {
      return this.#askReview(campaignId, single.userId, actor);
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

    const rows = view.recipients.map((r) => [
      this.btn(
        `${r.hasMyReview ? '✅' : ''}${recipientLabel(recipientRoleOf(r.userId, view.mentorId), view.myRole)} — ${names.get(r.userId) ?? ''}`,
        this.cb('open', campaignId, r.userId),
      ),
    ]);
    rows.push([this.#hubBtn()]);

    return this.screen(
      mdJoin([
        md`✍️ *Отзывы — поток «${stream.title}»*`,
        md``,
        ...campaignIntro(view.myRole, view.subjectOutcome, subjectName),
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

  /** S05/S04: ввод отзыва — подсказка или перезапись (✅-адресат). */
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
        this.kb([[this.#hubBtn()]]),
      );
    }
    const name =
      (await this.#namesOf([recipientId], actor)).get(recipientId) ?? '';
    const title = await this.#streamTitleOf(campaignId, actor);
    // Шапка-ориентир: при провале из списка/хаба понятно, о каком потоке речь
    const header = md`✍️ *Отзыв — поток «${title}»*`;
    const prompt = reviewPrompt(
      view.myRole,
      recipientRoleOf(recipientId, view.mentorId),
      name,
      view.subjectOutcome,
    );
    const context: ReviewInputContext = { campaignId, recipientId };
    // Назад — к родителю: список (>1 адресата) или хаб (единственный)
    const kb = this.kb([
      [this.#backAction(campaignId, view.recipients.length)],
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
   * Экран после сохранения — «откуда пришли в отзыв, туда и вернулись»:
   * несколько адресатов → список кампании S03 (обновлённые ✅ и метрики),
   * единственный → хаб S02 (список у такой кампании не показывается).
   * Инфо-сообщение о результате уходит первым, поверх нового экрана.
   */
  async #afterSaveResponse(
    campaignId: string,
    actor: User,
    notice: MdText,
  ): Promise<DialogResponse> {
    const view = await this.appApi.execute(
      'get-campaign-recipients',
      { campaignId, authorId: actor.uuid },
      actor,
    );
    const parent =
      view.recipients.length > 1 || !this.hub
        ? await this.#showRecipients(campaignId, actor)
        : await this.hub.showHub(actor);
    return { ...parent, notify: { text: notice } };
  }

  /** Кнопка «↩️ Мои отзывы» — родитель списка кампании. */
  #hubBtn() {
    return this.btn('↩️ Мои отзывы', this.cbFor('my-reviews', 'hub'));
  }

  /**
   * Кнопка «↩️ Назад» с экранов ввода — к родителю по построению:
   * в ввод попадают только из списка кампании, поэтому при нескольких
   * адресатах родитель — S03; при единственном S03 не показывается,
   * родитель — хаб S02.
   */
  #backAction(campaignId: string, recipientsCount: number) {
    return recipientsCount > 1
      ? this.btn('↩️ Назад', this.cb('list', campaignId))
      : this.#hubBtn();
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

/**
 * Подпись роли адресата в кнопке S03 — взгляд автора: субъекту соученик —
 * «Одногруппник», ментору адресат — «Студент» (ui-spec 2026-09-22).
 */
function recipientLabel(
  role: 'student' | 'mentor',
  myRole: 'subject' | 'mentor',
): string {
  if (role === 'mentor') return 'Ментор';
  return myRole === 'subject' ? 'Одногруппник' : 'Студент';
}

/** Роль адресата — по составу кампании: ментор известен из payload (S03). */
function recipientRoleOf(
  recipientId: string,
  mentorId: string,
): 'student' | 'mentor' {
  return recipientId === mentorId ? 'mentor' : 'student';
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

/**
 * Вводный абзац S03 — по паре «роль-судьба» (ui-spec 2026-09-22):
 * приглашение → кому и зачем полезен твой отзыв. Принципы «как писать»
 * здесь не дублируются — они встречают у ввода (S05/S04).
 */
function campaignIntro(
  myRole: 'subject' | 'mentor',
  subjectOutcome: AuthorOutcome,
  subjectName: string | undefined,
): MdText[] {
  const name = subjectName ?? 'студент';
  if (myRole === 'mentor') {
    if (
      subjectOutcome === 'completed_passed' ||
      subjectOutcome === 'completed_not_passed'
    ) {
      return [
        md`Ты был ментором этого потока\\. Выдай отзыв о подопечном — ${name}: как он проявлялся в учёбе, что удалось, что стоит подтянуть\\.`,
        md``,
        md`Отзыв станет частью его цифрового профиля: следующие менторы и работодатели увидят, с чем он справляется\\.`,
      ];
    }
    return [
      md`Ты был ментором этого потока\\. Подопечный ${name} покинул обучение — поделись наблюдениями: что удавалось, что можно было сделать иначе\\.`,
      md``,
      md`Школе это поможет лучше поддерживать студентов, а ${name} — вернуться, когда будет готов\\.`,
    ];
  }
  switch (subjectOutcome) {
    case 'dropped':
      return [
        md`Ты покинул обучение в этом потоке\\. Ментору и школе будет полезно понять, что помогало, а что мешало\\. Честный отзыв — лучший вклад в школу: тем, кто только выбирает обучение, он подскажет, чего от него ожидать\\.`,
      ];
    case 'never_started':
      return [
        md`Ты записался на поток, но не начал обучение\\. Расскажи, что тебя остановило: школа это учтёт и уберёт барьеры, а тем, кто раздумывает начинать, твой отзыв поможет принять решение с открытыми глазами\\.`,
      ];
    // «завершил и прошёл» / «завершил и не прошёл» — текст один
    default:
      return [
        md`Ты завершил обучение в этом потоке\\. Расскажи о совместной учёбе: что запомнилось, что было полезно, что можно улучшить\\. Пиши кому хочешь и сколько хочешь\\.`,
        md``,
        md`Отзыв одногруппникам поможет увидеть, что у них хорошо получается, а что стоит подтянуть\\. Если кто\\-то помог, с кем\\-то было приятно сотрудничать — или наоборот, опыт был неприятным, — всё это полезно и им, и тем, кто будет с ними работать\\.`,
        md``,
        md`Отзыв ментору поможет понять, что у него получается, а что нет\\. А потенциальным студентам — понять, подходит ли им этот ментор\\.`,
      ];
  }
}

/** Границы длины отзыва (спека S05). */
const REVIEW_MIN_CHARS = 10;
const REVIEW_MAX_CHARS = 3500;

/** Контекст ввода отзыва (живёт в dialog.input.context). */
interface ReviewInputContext {
  campaignId: string;
  recipientId: string;
}

/** Исход субъекта окна — 4 значения (ФР-1); он же исход автора-субъекта. */
type AuthorOutcome =
  | 'completed_passed'
  | 'completed_not_passed'
  | 'dropped'
  | 'never_started';

/** Принципы полезного отзыва — общий блок экранов ввода (S05/S04). */
const PRINCIPLES_BLOCK: MdText = md`Будь честен, пиши правду\\. Характеризуй навыки, а не людей: лучше описать конкретную ситуацию и свои ощущения, чем повесить ярлык\\. Такой отзыв приносит пользу\\.`;

/**
 * Текст-подсказка S05 — по направлению «кто о ком»; «о менторе» — ещё и
 * по исходу автора. Рекомендация двух частей с готовыми первыми строками
 * (моноширинные вставки; ui-spec 2026-09-22): префиксы не обязательны —
 * это опора, а не форма. Плейсхолдер {Имя} пользователь заменяет сам.
 */
function reviewPrompt(
  myRole: 'subject' | 'mentor',
  recipientRole: 'student' | 'mentor',
  name: string,
  subjectOutcome: AuthorOutcome,
): MdText {
  const lead = md`Предлагаем разделить отзыв на две части\\.`;
  if (recipientRole === 'student') {
    if (myRole === 'mentor') {
      return mdJoin([
        lead,
        md``,
        md`Сначала — \`Отзыв для {Имя}:\` \\(вместо \\{Имя\\} — ${name}\\) как студент проявлялся в учёбе: сильные стороны, чего удалось достичь за поток\\.`,
        md``,
        md`Затем с новой строки — \`Рекомендация по развитию:\` что стоит подтянуть и в каком направлении расти\\.`,
      ]);
    }
    return mdJoin([
      lead,
      md``,
      md`Сначала — \`Отзыв для {Имя}:\` \\(вместо \\{Имя\\} — ${name}\\) расскажи, как ${name} проявил\\(а\\) себя в учёбе — профессиональные, командные и личностные качества\\. Не обязательно перечислять всё — пиши то, что считаешь важным, и правду\\.`,
      md``,
      md`Затем с новой строки — \`Как с ним работать:\` короткую рекомендацию тем, кто будет учиться или работать рядом\\.`,
    ]);
  }
  switch (subjectOutcome) {
    case 'dropped':
      return mdJoin([
        lead,
        md``,
        md`Сначала — \`Отзыв для ментора:\` почему забросил\\(а\\) учёбу, что помогало, что мешало, какие пожелания школе и ментору\\.`,
        md``,
        md`Затем с новой строки — \`Следует ожидать от курса:\` твою рекомендацию тем, кто хочет выбрать это обучение\\.`,
      ]);
    case 'never_started':
      return mdJoin([
        lead,
        md``,
        md`Сначала — \`Что остановило:\` почему так и не начал\\(а\\) учёбу, что не совпало с ожиданиями\\.`,
        md``,
        md`Затем с новой строки — \`Моя рекомендация:\` что стоит знать школе и тем, кто выбирает обучение\\.`,
      ]);
    // «завершил и прошёл» / «завершил и не прошёл» — текст один
    // (и защита от рассинхрона формы)
    default:
      return mdJoin([
        lead,
        md``,
        md`Сначала — \`Отзыв для ментора:\` что помогало учиться, что мешало, чего не хватило\\.`,
        md``,
        md`Затем с новой строки — \`Моя рекомендация студентам:\` кому и почему подойдёт этот ментор\\.`,
      ]);
  }
}

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
