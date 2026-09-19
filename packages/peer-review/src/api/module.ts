import { U7ApiModule } from '@u7-scl/app/domain';
import type { ErMeta, EventReaction } from '@u7-scl/core/api';
import type {
  PeerReviewApiModuleMeta,
  PeerReviewApiModuleResolver,
} from '../domain/module';
import { CreateStudentCampaignEr } from './er/create-student-campaign-er';
import { CreateReviewUc } from './review/create-review-uc';
import { GetMyReviewUc } from './review/get-my-review-uc';
import { ListScopeFactsUc } from './review/list-scope-facts-uc';
import { ListScopeReviewsUc } from './review/list-scope-reviews-uc';
import { GetCampaignRecipientsUc } from './review-campaign/get-campaign-recipients-uc';
import { GetMyCampaignsUc } from './review-campaign/get-my-campaigns-uc';

export class PeerReviewApiModule extends U7ApiModule<
  PeerReviewApiModuleMeta,
  PeerReviewApiModuleResolver
> {
  readonly name = 'peer-review' as const;
  /** Пользовательские UC (ФР-7) — кампании создаёт ER из событий stream (ФР-6). */
  readonly useCases = [
    new GetMyCampaignsUc(),
    new GetCampaignRecipientsUc(),
    new CreateReviewUc(),
    new GetMyReviewUc(),
    new ListScopeReviewsUc(),
    new ListScopeFactsUc(),
  ];
  readonly reactions: EventReaction<ErMeta>[] = [new CreateStudentCampaignEr()];
  readonly jobs = [];
}
