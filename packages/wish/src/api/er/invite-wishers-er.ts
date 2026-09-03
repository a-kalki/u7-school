import type { ErMeta } from '@u7-scl/core/api';
import { EventReaction } from '@u7-scl/core/api';
import type { StreamCreatedEvent } from '@u7-scl/stream/domain';
import type { WishApiModuleResolver } from '#domain/module';
import type { Wish } from '#domain/wish/entity';

/** Метаданные реакции приглашения желающих при открытии набора. */
export interface InviteWishersErMeta extends ErMeta<StreamCreatedEvent> {
  erName: 'invite-wishers';
}

/**
 * Реакция на создание потока (открытие набора).
 *
 * Course-ветка: желания на курс зовутся только на поток первого модуля
 * курса (place.isFirst); набор на стартовый модуль — реализация course-желания.
 * Module-ветка: желания на модуль зовутся на поток любого модуля
 * (ретейкеры, «следующий модуль»).
 * Историческая идентичность (форки) решается только фасадом курсов.
 *
 * Приглашение — чистое уведомление через userFacade.notify (трек
 * user-notify): текст FR-6 #8 с контекстом (поток, дата, ментор) ER
 * собирает сам; доставку и резолв telegramId выполняет сторя notify.
 * Поток недоступен — рассылка невозможна, молчаливый пропуск.
 */
export class InviteWishersEr extends EventReaction<
  InviteWishersErMeta,
  WishApiModuleResolver
> {
  protected readonly eventName = 'stream.created' as const;
  protected readonly erName = 'invite-wishers' as const;
  protected readonly erLabel = 'Пригласить желающих при открытии набора';

  async handle(event: InviteWishersErMeta['event']): Promise<void> {
    const { streamId, moduleId } = event.payload;

    // Место модуля потока в опубликованном курсе.
    // undefined — модуль вне опубликованных программ: course-ветка молчит.
    const place = await this.resolve.courseFacade.getModulePlace(moduleId);

    // Course-ветка — только набор на стартовый модуль курса.
    if (place?.isFirst) {
      const candidates = await this.resolve.wishRepo.findAllByKind('course', [
        'expressed',
        'confirmed',
      ]);
      const courseCandidates = candidates.filter(
        (w): w is Wish & { target: { kind: 'course'; courseId: string } } =>
          w.target.kind === 'course',
      );
      const matched = new Set(
        await this.resolve.courseFacade.whichCoursesIncludeModule(
          moduleId,
          courseCandidates.map((w) => w.target.courseId),
        ),
      );
      for (const wish of courseCandidates) {
        if (!matched.has(wish.target.courseId)) {
          continue;
        }
        await this.#invite(wish, streamId);
      }
    }

    // Module-ветка — поток на любой модуль.
    const candidates = await this.resolve.wishRepo.findAllByKind('module', [
      'expressed',
      'confirmed',
    ]);
    if (candidates.length > 0) {
      const moduleCandidates = candidates.filter(
        (w): w is Wish & { target: { kind: 'module'; moduleId: string } } =>
          w.target.kind === 'module',
      );
      const matched = new Set(
        await this.resolve.courseFacade.whichModulesAreSame(
          moduleId,
          moduleCandidates.map((w) => w.target.moduleId),
        ),
      );
      for (const wish of moduleCandidates) {
        if (!matched.has(wish.target.moduleId)) {
          continue;
        }
        await this.#invite(wish, streamId);
      }
    }
  }

  /** Уведомление желающему (текст FR-6 #8). Поток недоступен — пропуск. */
  async #invite(wish: Wish, streamId: string): Promise<void> {
    const stream = await this.resolve.streamFacade.getStream(streamId);
    if (!stream) return;

    const mentor = await this.resolve.userFacade.getUserByUuid(stream.mentorId);

    // Старт: дд.мм.гггг (UTC потока); сбой формата — исходная строка
    let dateText = stream.startDate;
    try {
      const d = new Date(stream.startDate);
      dateText = [
        String(d.getUTCDate()).padStart(2, '0'),
        String(d.getUTCMonth() + 1).padStart(2, '0'),
        d.getUTCFullYear(),
      ].join('.');
    } catch {
      // оставляем ISO-строку
    }

    const mentorLine = mentor?.name ? ` Ментор: ${mentor.name}.` : '';

    const text = `📣 Открылся набор на «${stream.title}», который ты хотел пройти! Старт: ${dateText}.${mentorLine} Подробности: /start → 📚 Потоки курсов. Для записи нужен ключ — его выдаёт ментор. Не актуально — отмени желание: 📖 Программы курсов → карточка курса → 🗑️.`;

    await this.resolve.userFacade.notify(wish.userId, text);
  }
}
