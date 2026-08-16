import type { ErMeta, EventReaction } from '@u7-scl/core/api';
import { ApiModule } from '@u7-scl/core/api';
import type { WishApiModuleMeta, WishApiModuleResolver } from '#domain/module';
import { RecordWishEr } from './er/record-wish-er';
import { CancelWishUc } from './wish/cancel-wish-uc';
import { ExpressWishUc } from './wish/express-wish-uc';

export class WishApiModule extends ApiModule<
  WishApiModuleMeta,
  WishApiModuleResolver
> {
  readonly name = 'wish' as const;
  readonly useCases = [new ExpressWishUc(), new CancelWishUc()];
  readonly reactions: EventReaction<ErMeta>[] = [new RecordWishEr()];

  constructor(resolve: WishApiModuleResolver) {
    super(resolve);
    this.init();
  }
}
