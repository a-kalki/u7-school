import type { ErMeta, EventReaction } from '@u7-scl/core/api';
import { ApiModule } from '@u7-scl/core/api';
import type { WishApiModuleMeta, WishApiModuleResolver } from '#domain/module';
import { AbandonWishEr } from './er/abandon-wish-er';
import { ConfirmWishEr } from './er/confirm-wish-er';
import { FulfillWishEr } from './er/fulfill-wish-er';
import { CancelWishUc } from './wish/cancel-wish-uc';
import { CreateCourseWishUc } from './wish/create-course-wish-uc';

export class WishApiModule extends ApiModule<
  WishApiModuleMeta,
  WishApiModuleResolver
> {
  readonly name = 'wish' as const;
  readonly useCases = [new CreateCourseWishUc(), new CancelWishUc()];
  readonly reactions: EventReaction<ErMeta>[] = [
    new ConfirmWishEr(),
    new AbandonWishEr(),
    new FulfillWishEr(),
  ];

  constructor(resolve: WishApiModuleResolver) {
    super(resolve);
    this.init();
  }
}
