import { Job, type JobMeta, type JobSchedule } from '@u7-scl/core/api';
import type { DomainEvent } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import type { QuestionnaireApiModuleResolver } from '../../domain/module';
import type { Questionnaire } from '../../domain/questionnaire/entity';
import type { QuestionnaireAbandonWarningEvent } from '../../domain/questionnaire/events';
import { QuestionnaireAr } from '../../domain/questionnaire/standard/questionnaire-ar';

/** Порог предупреждения: анкета неактивна 6 часов */
export const WARN_AFTER_IDLE_MS = 6 * 60 * 60 * 1000;

/** Порог закрытия: анкета неактивна 8 часов */
export const ABANDON_AFTER_IDLE_MS = 8 * 60 * 60 * 1000;

/** Интервал запуска */
export const INTERVAL_MS = 60 * 60 * 1000;

/** Лог-источник задания */
const SOURCE = 'sweep-abandoned-questionnaires';

/** Мета задания — типизирует jobName/jobLabel */
interface SweepAbandonedJobMeta extends JobMeta {
  name: typeof SOURCE;
  label: 'Предупреждение и закрытие брошенных анкет';
}

/**
 * Обход брошенных анкет: предупреждение через 6ч простоя,
 * принудительное закрытие через 8ч.
 *
 * - Время простоя считается от updatedAt (любая активность респондента
 *   сбрасывает таймер; предупреждение — НЕТ: markWarned обходит safeUpdate).
 * - Обрабатываются только анкеты kind='standard'.
 * - Ошибка обработки одной анкеты не прерывает обход.
 */
export class SweepAbandonedJob extends Job<
  SweepAbandonedJobMeta,
  QuestionnaireApiModuleResolver
> {
  readonly jobName = 'sweep-abandoned-questionnaires';
  readonly jobLabel = 'Предупреждение и закрытие брошенных анкет';
  readonly schedule: JobSchedule = {
    kind: 'interval',
    intervalMs: INTERVAL_MS,
  };

  async execute(): Promise<void> {
    const active = await this.resolve.questionnaireRepo.getActive();

    for (const state of active) {
      if (state.kind !== 'standard') continue;

      // Простое время: от последнего обновления (или создания)
      const idleFrom = Date.parse(state.updatedAt ?? state.createdAt);
      const idleMs = Date.now() - idleFrom;

      try {
        if (idleMs >= ABANDON_AFTER_IDLE_MS) {
          await this.abandonByTimeout(state);
        } else if (idleMs >= WARN_AFTER_IDLE_MS && !state.warnedAt) {
          await this.warn(state);
        }
      } catch (err) {
        // Ошибка одной анкеты не должна ломать весь обход
        this.resolve.appResolver.logger.warn(
          SOURCE,
          `Не удалось обработать анкету ${state.uuid}: ${String(err)}`,
        );
      }
    }
  }

  /** Предупреждение о закрытии: warnedAt + событие questionnaire:abandon-warning */
  private async warn(state: Questionnaire): Promise<void> {
    const ar = new QuestionnaireAr(state);
    ar.markWarned();
    await this.resolve.questionnaireRepo.save(ar.state);

    const telegramId = await this.resolveTelegramId(state);
    if (telegramId === undefined) return;

    const event: QuestionnaireAbandonWarningEvent = {
      eventId: crypto.randomUUID(),
      eventName: 'questionnaire:abandon-warning',
      occurredAt: isoNow(),
      aggregateName: 'Questionnaire',
      aggregateId: state.uuid,
      ownerInfo: state.ownerInfo,
      payload: {
        questionnaireId: state.uuid,
        respondentId: state.respondentId,
        telegramId,
      },
    };
    this.#publishAll([event]);
  }

  /** Принудительное закрытие по таймауту: abandon + событие с reason='timeout' */
  private async abandonByTimeout(state: Questionnaire): Promise<void> {
    const ar = new QuestionnaireAr(state);
    ar.abandon('timeout');
    await this.resolve.questionnaireRepo.save(ar.state);

    const telegramId = await this.resolveTelegramId(state);
    const events = ar.flushEvents();

    for (const event of events) {
      if (event.eventName === 'questionnaire:abandon') {
        event.payload.telegramId = telegramId;
      }
    }
    this.#publishAll(events);
  }

  /** Публикует события через базовый publishEvents (носитель — массив) */
  #publishAll(events: DomainEvent[]): void {
    this.publishEvents({
      hasEvents: () => events.length > 0,
      flushEvents: () => events.splice(0),
    });
  }

  /** Telegram ID респондента (может отсутствовать, если пользователь удалён) */
  private async resolveTelegramId(
    state: Questionnaire,
  ): Promise<number | undefined> {
    const user = await this.resolve.userFacade.getUserByUuid(
      state.respondentId,
    );
    return user?.telegramId;
  }
}
