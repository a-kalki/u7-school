import type { ErMeta } from '@u7-scl/core/api';
import { EventReaction } from '@u7-scl/core/api';
import type { StreamCompletedEvent } from '@u7-scl/stream/domain';
import type { PeerReviewApiModuleResolver } from '#domain/module';
import type { CreateCampaignUc } from '../review-campaign/create-campaign-uc';

/** Метаданные реакции создания кампании отзывов при завершении потока. */
export interface StreamCompletedErMeta extends ErMeta<StreamCompletedEvent> {
  erName: 'stream-completed';
}

/**
 * Реакция на завершение потока (ФР-7): создаёт кампанию сбора отзывов
 * контекста stream_completed.
 *
 * Оркестрация — в CreateCampaignUc (идемпотентность: повтор события не
 * создаёт дубль кампании). В будущем триггер переносится на личное событие
 * student.completed — техдолг концепции §4.1, каркас не меняется.
 * Ошибки UC наружу не выплёскиваются (шина изолирует) — лог-предупреждение.
 */
export class StreamCompletedEr extends EventReaction<
  StreamCompletedErMeta,
  PeerReviewApiModuleResolver
> {
  protected readonly eventNames = ['stream.completed'] as const;
  protected readonly erName = 'stream-completed' as const;
  protected readonly erLabel = 'Создать кампанию отзывов при завершении потока';

  readonly #createCampaign: CreateCampaignUc;

  /** UC передаётся модулем — общий инстанс из useCases (единый резолвер). */
  constructor(createCampaign: CreateCampaignUc) {
    super();
    this.#createCampaign = createCampaign;
  }

  async handle(event: StreamCompletedErMeta['event']): Promise<void> {
    try {
      await this.#createCampaign.handle(
        { context: 'stream_completed', scopeId: event.payload.streamId },
        undefined,
      );
    } catch (err) {
      this.resolve.appResolver.logger.warn(
        this.erName,
        `Кампания отзывов для потока ${event.payload.streamId} не создана: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
