import { U7ApiModule } from '@u7-scl/app/domain';
import type { ErMeta, EventReaction } from '@u7-scl/core/api';
import type {
  PeerReviewApiModuleMeta,
  PeerReviewApiModuleResolver,
} from '../domain/module';
import { StreamCompletedEr } from './er/stream-completed-er';
import { CreateCampaignUc } from './review-campaign/create-campaign-uc';

export class PeerReviewApiModule extends U7ApiModule<
  PeerReviewApiModuleMeta,
  PeerReviewApiModuleResolver
> {
  readonly name = 'peer-review' as const;
  /** UC и ER делят инстанс: реакция зовёт use-case с тем же резолвером */
  private readonly createCampaignUc = new CreateCampaignUc();
  readonly useCases = [this.createCampaignUc];
  readonly reactions: EventReaction<ErMeta>[] = [
    new StreamCompletedEr(this.createCampaignUc),
  ];
  readonly jobs = [];
}
