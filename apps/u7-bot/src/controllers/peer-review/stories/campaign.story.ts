import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import { AppException } from '@u7-scl/core/domain';
import { type MdText, md, mdJoin } from '@u7-scl/core/shared';
import type { BotSession, BotUpdate, DialogResponse } from '@u7-scl/core/ui';
import { buttons } from '../../shared/buttons';

/**
 * US: Кампания отзывов — карточка кампании и ввод отзыва
 * (S03 список адресатов → S05 ввод → S06 сохранение, S04 перезапись,
 * S05i справка «Как писать отзыв»).
 *
 * Вход: `list:<campaignId>` — из приглашения (S01) или хаба «Отзывы» (S02).
 * Тексты — ui-spec 2026-09-22: тракт «от общего к частному» — вводный абзац
 * S03 («кому и зачем») по паре «роль-судьба», подсказка S05 («что именно
 * и как»: мягкий шаблон двух секций + принципы), справка S05i по кнопке
 * без выхода из ввода. Адресация и ✅-признак считаются доменом
 * (`get-campaign-recipients`).
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
    if (cmd === 'how' && campaignId && recipientId) {
      return this.#showHowTo(campaignId, recipientId);
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
        md`✍️ Отзыв — от ${REVIEW_MIN_CHARS} символов\\. Напиши чуть подробнее\\.`,
      );
    }
    if (text.length > REVIEW_MAX_CHARS) {
      return this.warn(
        md`✍️ Спасибо за развёрнутость, но лимит — ${REVIEW_MAX_CHARS} символов\\. Пожалуйста, сократи отзыв\\.`,
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
      // Окно истекло пока писали — экран-заглушка (спека: возможности нет)
      if (
        err instanceof AppException &&
        err.error.name === 'REVIEW_WINDOW_CLOSED'
      ) {
        return this.screen(
          md`⌛ Возможность написать отзыв уже закрыта\\.`,
          this.kb([[buttons.mainMenu()]]),
        );
      }
      // Прочие ошибки домена (чужой адресат и т.п.) — реплика поверх
      return this.errorNotify(err);
    }
  }

  /** S03/S06: карточка кампании — контекст судьбы, прогресс, адресаты. */
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
    const subjectName = (await this.#namesOf([card.subjectId], actor)).get(
      card.subjectId,
    );

    const rows = view.recipients.map((r) => [
      this.btn(
        `${r.hasMyReview ? '✅' : ''}${recipientLabel(recipientRoleOf(r.userId, view.mentorId), view.myRole)} — ${names.get(r.userId) ?? ''}`,
        this.cb('open', campaignId, r.userId),
      ),
    ]);
    rows.push([buttons.mainMenu()]);

    // S06: после сохранения — заголовок с именем, прогресс обновлён
    const header = savedId
      ? md`✅ Отзыв о ${names.get(savedId) ?? ''} сохранён\\. О ком ещё рассказать?`
      : md`✍️ *Отзывы — поток «${stream.title}»*`;

    return this.screen(
      mdJoin([
        header,
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
        this.kb([[buttons.mainMenu()]]),
      );
    }
    const name =
      (await this.#namesOf([recipientId], actor)).get(recipientId) ?? '';
    const prompt = reviewPrompt(
      view.myRole,
      recipientRoleOf(recipientId, view.mentorId),
      name,
      view.subjectOutcome,
    );
    const context: ReviewInputContext = { campaignId, recipientId };
    // Кнопка справки — в обоих экранах ввода, без выхода из ввода
    const kb = this.kb([
      [
        this.btn('⏭️ Пропустить', this.cb('skip', campaignId)),
        this.btn(
          '❔ Как писать отзыв',
          this.cb('how', campaignId, recipientId),
        ),
      ],
    ]);
    if (!recipient.hasMyReview) {
      return this.ask(mdJoin([prompt, md``, PRINCIPLES_BLOCK]), context, kb);
    }

    // S04: адресат уже отозван — экран перезаписи с текущим текстом
    const my = await this.appApi.execute(
      'get-my-review',
      { campaignId, authorId: actor.uuid, recipientId },
      actor,
    );
    if (!my.found) {
      // рассинхрон признака (гонка) — обычный ввод S05
      return this.ask(mdJoin([prompt, md``, PRINCIPLES_BLOCK]), context, kb);
    }
    return this.ask(
      mdJoin([
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
      this.kb([
        [
          this.btn('❌ Назад', this.cb('skip', campaignId)),
          this.btn(
            '❔ Как писать отзыв',
            this.cb('how', campaignId, recipientId),
          ),
        ],
      ]),
    );
  }

  /**
   * S05i: справка «Как писать отзыв» — по кнопке с экранов ввода.
   * Screen без ask: диалог ввода (контекст, переспросы) сохраняется —
   * «↩️ К вводу» возвращает подсказку, текст пользователя всё ещё ждёт.
   */
  #showHowTo(campaignId: string, recipientId: string): DialogResponse {
    return this.screen(
      HOW_TO_REVIEW,
      this.kb([
        [this.btn('↩️ К вводу', this.cb('open', campaignId, recipientId))],
      ]),
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

/** 📊 Прогресс — развёрнутые метрики S03/S06 (каждая — своей строкой). */
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
 * по исходу автора. Мягкий шаблон двух секций: готовые первые строки,
 * префиксы не обязательны (ui-spec 2026-09-22).
 */
function reviewPrompt(
  myRole: 'subject' | 'mentor',
  recipientRole: 'student' | 'mentor',
  name: string,
  subjectOutcome: AuthorOutcome,
): MdText {
  if (recipientRole === 'student') {
    if (myRole === 'mentor') {
      return md`Начни со строки "Отзыв для ${name}:" — как студент проявлялся в учёбе: сильные стороны, чего удалось достичь за поток\\. Затем через пустую строку добавь "Рекомендация по развитию:" — что стоит подтянуть и в каком направлении расти\\.`;
    }
    return md`Начни со строки "Отзыв для ${name}:" — расскажи, как ${name} проявил\\(а\\) себя в учёбе: профессиональные, командные и личностные качества\\. Не обязательно перечислять всё — пиши то, что считаешь важным, и правду\\. Затем через пустую строку добавь "Как с ним работать:" — короткую рекомендацию тем, кто будет учиться или работать рядом\\.`;
  }
  switch (subjectOutcome) {
    case 'dropped':
      return md`Начни со строки "Отзыв для ментора:" — почему забросил\\(а\\) учёбу, что помогало, что мешало, какие пожелания школе и ментору\\. Затем через пустую строку добавь "Следует ожидать от курса:" — твою рекомендацию тем, кто рассматривает это обучение\\.`;
    case 'never_started':
      return md`Начни со строки "Что остановило:" — почему так и не начал\\(а\\) учёбу, что не совпало с ожиданиями\\. Затем через пустую строку добавь "Моя рекомендация:" — что стоит знать школе и тем, кто выбирает обучение\\.`;
    // «завершил и прошёл» / «завершил и не прошёл» — текст один
    // (и защита от рассинхрона формы)
    default:
      return md`Начни со строки "Отзыв для ментора:" — что помогало учиться, что мешало, чего не хватило\\. Затем через пустую строку добавь "Моя рекомендация студентам:" — кому и почему подойдёт этот ментор\\. Пиши правду\\.`;
  }
}

/** S05i: справка «Как писать отзыв» (ui-spec 2026-09-22, примеры обезличены). */
const HOW_TO_REVIEW: MdText = mdJoin([
  md`❔ *Как писать отзыв*`,
  md``,
  md`Отзыв полезен, когда говорит о навыках и конкретных ситуациях — а не о людях\\.`,
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
]);
