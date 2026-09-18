import { U7ApiModule } from '@u7-scl/app/domain';
import type { ErMeta, EventReaction } from '@u7-scl/core/api';
import type {
  PeerReviewApiModuleMeta,
  PeerReviewApiModuleResolver,
} from '../domain/module';
import { CreateStudentCampaignEr } from './er/create-student-campaign-er';

export class PeerReviewApiModule extends U7ApiModule<
  PeerReviewApiModuleMeta,
  PeerReviewApiModuleResolver
> {
  readonly name = 'peer-review' as const;
  /** Пользовательских UC нет — кампании создаёт ER из событий stream (ФР-6). */
  readonly useCases = [];
  readonly reactions: EventReaction<ErMeta>[] = [new CreateStudentCampaignEr()];
  readonly jobs = [];
}
