import type { User } from '@u7-scl/app/domain';
import { U7BotUiStory } from '@u7-scl/bot/u7-bot-ui-story';
import type { MenuButton } from '@u7-scl/bot/u7-menu';
import { type MdText, md, mdJoin } from '@u7-scl/core/shared';
import type {
  BotSession,
  DialogResponse,
  KbButton,
  Page,
} from '@u7-scl/core/ui';
import type { MyCampaignCard } from '@u7-scl/peer-review/domain';
import { buttons } from '../../shared/buttons';
import { campaignProfileOf } from './campaign-profiles';

/** Данные кнопки карточки хаба — payload постраничного экрана. */
interface HubCardBtn {
  campaignId: string;
  context: MyCampaignCard['context'];
  /** Сквозной номер карточки в списке (текст = кнопка). */
  no: number;
  mentor: boolean;
  title: string;
  subjectName?: string;
}

/**
 * US: Хаб «Мои отзывы» (S02) — список живых кампаний автора.
 *
 * Вход: `hub` — кнопка главного меню «💬 Отзывы» (видна при наличии живых
 * кампаний — UC `get-my-campaigns` с `onlyLives`, асинхронная проверка).
 * Экран (ui-spec 2026-09-22): абстрактное интро «что это за место» →
 * нумерованные мини-карточки кампаний (контекст судьбы по паре
 * «роль-судьба» + краткие метрики `M/K (N дн.)`) → кнопки внизу с номером
 * карточки (в Telegram кнопку нельзя приклеить к тексту — номер даёт связь).
 * Из приглашения (S01) пользователь попадает сразу в S03, минуя этот экран.
 *
 * Пагинация: карточки страницы собирает `pagedScreen` (BotPaginator —
 * бюджет символов страницы от лимита Telegram), кнопки-номера следуют
 * своей странице (`rowsPage`): нумерация карточек сквозная, на странице —
 * только её кнопки. Листание — `hub-page:<n>`, экраны редактируются
 * на месте. Ментор закрытого потока видит все его кампании — без
 * пагинации список карточек не влезает в одно сообщение.
 */
export class MyReviewsStory extends U7BotUiStory {
  readonly name = 'my-reviews';

  /** Ключ кеша страниц хаба (DialogCache — эпоха диалога). */
  #cacheKey = 'my-reviews:hub';

  // ── Главное меню (декларативная кнопка) ──

  override async menuButtons(actor: User): Promise<MenuButton[]> {
    const cards = await this.appApi.execute(
      'get-my-campaigns',
      { userId: actor.uuid, onlyLives: true },
      actor,
    );
    if (cards.length === 0) return [];
    return [
      {
        kind: 'callback',
        text: '💬 Отзывы',
        action: this.cb('hub'),
        priority: 25,
        description: '💬 Отзывы — расскажи об учёбе участникам потока',
      },
    ];
  }

  // ── Callback ──

  override async handleCallback(
    action: string,
    actor: User,
    session: BotSession,
  ): Promise<DialogResponse> {
    const [cmd, pageSeg] = action.split(':');
    if (cmd === 'hub') {
      return this.showHub(actor, session);
    }
    if (cmd === 'hub-page') {
      const page = Number(pageSeg);
      return this.showHub(actor, session, Number.isNaN(page) ? 0 : page);
    }
    return this.unknownCommand(action, actor, session);
  }

  /**
   * S02: интро + нумерованные мини-карточки + кнопки с номерами.
   * `session` — для кеша страниц (тыки навигации не перечитывают домен);
   * без него экран пересобирается (возврат из S06 — прогресс должен быть
   * свежим).
   */
  async showHub(
    actor: User,
    session?: BotSession,
    pageIndex = 0,
  ): Promise<DialogResponse> {
    return this.pagedScreen({
      // Весь домен читается в build: кеш покрывает и список карточек
      build: async () => {
        const cards = await this.appApi.execute(
          'get-my-campaigns',
          { userId: actor.uuid, onlyLives: true },
          actor,
        );
        if (cards.length === 0) {
          return {
            header: md``,
            blocks: [] as string[],
            payload: [] as HubCardBtn[],
          };
        }
        const [titles, names] = await Promise.all([
          this.#titlesOf(
            cards.map((c) => c.scopeId),
            actor,
          ),
          this.#namesOf(
            cards.filter((c) => c.myRole === 'mentor').map((c) => c.subjectId),
            actor,
          ),
        ]);

        // Payload кнопок — по карточке: текст/код кнопки и её место в списке
        const payload: HubCardBtn[] = cards.map((card, i) => ({
          campaignId: card.campaignId,
          context: card.context,
          no: i + 1,
          mentor: card.myRole === 'mentor',
          title: titles.get(card.scopeId) ?? '',
          subjectName: names.get(card.subjectId),
        }));

        return {
          header: this.#header(),
          blocks: this.#blocks(cards, titles, names),
          payload,
        };
      },
      // Гонка: окно истекло после рендера меню — та же заглушка, что и в S03
      emptyScreen: () => this.#emptyScreen(),
      rowsPage: (page, cardBtns) => this.#cardRows(page, cardBtns),
      cacheKey: this.#cacheKey,
      pageIndex,
      cbPage: (n) => this.cb('hub-page', String(n)),
      session: session ?? {},
      tgId: actor.telegramId,
    });
  }

  /** Шапка хаба: заголовок + абстрактное интро «что это за место». */
  #header(): MdText {
    return mdJoin([
      md`💬 *Мои отзывы*`,
      md``,
      md`Здесь ты можешь оставить отзывы участникам своих потоков и мероприятий\\. Это помогает людям расти, а школе — делать обучение лучше\\.`,
    ]);
  }

  /** Экран-заглушка: окна истекли после рендера меню. */
  #emptyScreen(): DialogResponse {
    return this.screen(
      md`⌛ Открытых окон отзывов нет — возможность появляется после завершения потока\\.`,
      this.kb([[buttons.mainMenu()]]),
    );
  }

  /**
   * Мини-карточки — строки-блоки для пагинатора: заголовок с номером,
   * текст пары «роль-судьба», метрики; линия-разделитель перед всеми,
   * кроме первой. Нумерация сквозная — кнопки страницы показывают её же.
   */
  #blocks(
    cards: MyCampaignCard[],
    titles: Map<string, string>,
    names: Map<string, string>,
  ): string[] {
    return cards.map((card, i) => {
      const profile = campaignProfileOf(card.context);
      const title = titles.get(card.scopeId) ?? '';
      const subjectName = names.get(card.subjectId);
      const metrics = `Метрики: ${card.progress.done}/${card.progress.total} (${card.daysLeft} дн.)`;
      const block = mdJoin([
        md`${i + 1}\\. *${profile.hubCardTitle(title)}*`,
        md`${profile.hubCardText(card, subjectName)}`,
        md`${metrics}`,
      ]);
      return i > 0 ? mdJoin([md`──────────────`, block]) : block;
    });
  }

  /**
   * Кнопки страницы: ровно карточки этой страницы (курсоры page.start /
   * items.length), в тех же номерах, что в тексте; главное меню — последним.
   */
  #cardRows(page: Page, cardBtns: HubCardBtn[]): KbButton[][] {
    const rows = cardBtns
      .slice(page.start, page.start + page.items.length)
      .map((b) => [
        this.btn(
          b.mentor
            ? campaignProfileOf(b.context).hubMentorBtn(b.no, b.subjectName)
            : campaignProfileOf(b.context).hubSubjectBtn(b.no, b.title),
          this.cbFor('campaign', 'list', b.campaignId),
        ),
      ]);
    rows.push([buttons.mainMenu()]);
    return rows;
  }

  /** Названия потоков по scopeId карточек. */
  async #titlesOf(
    scopeIds: string[],
    actor: User,
  ): Promise<Map<string, string>> {
    const titles = new Map<string, string>();
    for (const scopeId of scopeIds) {
      const stream = await this.appApi.execute(
        'get-stream',
        { streamId: scopeId },
        actor,
      );
      titles.set(scopeId, stream.title);
    }
    return titles;
  }

  /** Имена субъектов (для менторских карточек) — один batch-запрос. */
  async #namesOf(userIds: string[], actor: User): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    if (userIds.length === 0) return names;
    const users = await this.appApi.execute(
      'get-users-by-ids',
      { userIds },
      actor,
    );
    for (const user of users) {
      names.set(user.uuid, user.name);
    }
    return names;
  }
}
