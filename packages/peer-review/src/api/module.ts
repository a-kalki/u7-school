import { U7ApiModule } from '@u7-scl/app/domain';
import type { ErMeta, EventReaction } from '@u7-scl/core/api';
import type {
  PeerReviewApiModuleMeta,
  PeerReviewApiModuleResolver,
} from '../domain/module';

export class PeerReviewApiModule extends U7ApiModule<
  PeerReviewApiModuleMeta,
  PeerReviewApiModuleResolver
> {
  readonly name = 'peer-review' as const;
  readonly useCases = [];
  readonly reactions: EventReaction<ErMeta>[] = [];
  readonly jobs = [];
}
