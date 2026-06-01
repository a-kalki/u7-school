import { ApiModule } from '@u7-scl/core/api';
import type {
  StreamApiModuleMeta,
  StreamApiModuleResolver,
} from '#domain/module';
import { CreateStreamUc } from './stream/create-stream-uc';
import { ListStreamsUc } from './stream/list-streams-uc';
import { EnrollStudentUc } from './student/enroll-student-uc';

export class StreamApiModule extends ApiModule<
  StreamApiModuleMeta,
  StreamApiModuleResolver
> {
  readonly name = 'stream' as const;
  readonly useCases = [
    new CreateStreamUc(),
    new ListStreamsUc(),
    new EnrollStudentUc(),
  ];

  constructor(resolve: StreamApiModuleResolver) {
    super();
    this.initResolve(resolve);
  }
}
