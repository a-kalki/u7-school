import { Job, type JobMeta, type JobSchedule } from '@u7-scl/core/api';
import type { DomainEvent } from '@u7-scl/core/domain';
import { isoNow } from '@u7-scl/core/shared';
import type { QuestionnaireApiModuleResolver } from '../../domain/module';
import type { Questionnaire } from '../../domain/questionnaire/entity';
import type {
  QuestionnaireAbandonWarningEvent,
  QuestionnaireContinueInviteEvent,
} from '../../domain/questionnaire/events';
import { QuestionnaireAr } from '../../domain/questionnaire/standard/questionnaire-ar';

// ══ Пороги и интервал (spec FR-4): только именованные константы ══

/** Порог приглашения продолжить: анкета неактивна 3 часа */
export const INVITE_AFTER_HOURS = 3;

/** Порог предупреждения: анкета неактивна 6 часов */
export const WARN_AFTER_HOURS = 6;

/** Порог закрытия: анкета неактивна 9 часов */
export const ABANDON_AFTER_HOURS = 9;

const HOUR_MS = 60 * 60 * 1000;

/** Порог приглашения продолжить (мс) */
export const INVITE_AFTER_IDLE_MS = INVITE_AFTER_HOURS * HOUR_MS;

/** Порог предупреждения (мс) */
export const WARN_AFTER_IDLE_MS = WARN_AFTER_HOURS * HOUR_MS;

/** Порог закрытия (мс) */
export const ABANDON_AFTER_IDLE_MS = ABANDON_AFTER_HOURS * HOUR_MS;

/** Интервал запуска job — 3 часа */
export const INTERVAL_MS = INVITE_AFTER_IDLE_MS;

const SOURCE = 'sweep-abandoned-questionnaires';

interface SweepAbandonedJobMeta extends JobMeta {
  name: typeof SOURCE;
  label: 'Продолжение, предупреждение и закрытие брошенных анкет';
}

/**
 * Обход брошенных анкет — цепочка ступеней простоя (spec FR-4):
 * 3ч → приглашение продолжить (takeover-кнопка),
 * 6ч → предупреждение о закрытии,
 * 9ч → принудительное закрытие.
 *
 * - Время простоя считается от updatedAt (любая активность респондента
 *   сбрасывает таймер И цепочку ступеней: handleAction удаляет флаги
 *   continueInvitedAt/warnedAt — см. BaseQuestionnaireAr.#resetIdleFlags).
 * - Метки ступеней (continueInvitedAt/warnedAt) обходят safeUpdate —
 *   таймер простоя не сдвигается.
 * - Тип, активность и порог простоя фильтруются в запросе репозитория (getIdle).
 * - Ошибка обработки одной анкеты не прерывает обход.
 */
export class SweepAbandonedJob extends Job<
  SweepAbandonedJobMeta,
  QuestionnaireApiModuleResolver
> {
  readonly jobName = 'sweep-abandoned-questionnaires';
  readonly jobLabel = 'Продолжение, предупреждение и закрытие брошенных анкет';
  readonly schedule: JobSchedule = {
    kind: 'interval',
    intervalMs: INTERVAL_MS,
  };

  async execute(): Promise<void> {
    const idle = await this.resolve.questionnaireRepo.getIdle({
      idleMs: INVITE_AFTER_IDLE_MS,
      kinds: ['standard'],
    });

    for (const state of idle) {
      // Точный простой: репо отсёк всё ниже порога приглашения,
      // здесь различаем пороги приглашения/предупреждения/закрытия
      const idleFrom = Date.parse(state.updatedAt ?? state.createdAt);
      const idleMs = Date.now() - idleFrom;

      try {
        if (idleMs >= ABANDON_AFTER_IDLE_MS) {
          await this.abandonByTimeout(state);
        } else if (idleMs >= WARN_AFTER_IDLE_MS) {
          if (!state.warnedAt) {
            await this.warn(state);
          }
        } else if (!state.continueInvitedAt) {
          await this.inviteToContinue(state);
        }
      } catch (err) {
        this.resolve.appResolver.logger.warn(
          SOURCE,
          `Не удалось обработать анкету ${state.uuid}: ${String(err)}`,
        );
      }
    }
  }

  /**
   * Приглашение продолжить заполнение: continueInvitedAt + событие
   * questionnaire:continue-invite (UI рендерит takeover-кнопку «Продолжить»).
   */
  private async inviteToContinue(state: Questionnaire): Promise<void> {
    const ar = new QuestionnaireAr(state);
    ar.markContinueInvited();
    await this.resolve.questionnaireRepo.save(ar.state);

    const telegramId = await this.resolveTelegramId(state);
    if (telegramId === undefined) return;

    const event: QuestionnaireContinueInviteEvent = {
      eventId: crypto.randomUUID(),
      eventName: 'questionnaire:continue-invite',
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
