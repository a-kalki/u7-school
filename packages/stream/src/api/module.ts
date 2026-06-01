import { ApiModule } from '@u7-scl/core/api';
import type {
  StreamApiModuleMeta,
  StreamApiModuleResolver,
} from '#domain/module';
import { ActivateStreamUc } from './stream/activate-stream-uc';
import { ArchiveStreamUc } from './stream/archive-stream-uc';
import { CompleteStreamUc } from './stream/complete-stream-uc';
import { CreateStreamUc } from './stream/create-stream-uc';
import { ListStreamsUc } from './stream/list-streams-uc';
import { CompleteStepUc } from './student/complete-step-uc';
import { EnrollStudentUc } from './student/enroll-student-uc';
import { GetStudentProgressUc } from './student/get-student-progress-uc';

export class StreamApiModule extends ApiModule<
  StreamApiModuleMeta,
  StreamApiModuleResolver
> {
  readonly name = 'stream' as const;
  readonly useCases = [
    new CreateStreamUc(),
    new ListStreamsUc(),
    new ActivateStreamUc(),
    new CompleteStreamUc(),
    new ArchiveStreamUc(),
    new EnrollStudentUc(),
    new CompleteStepUc(),
    new GetStudentProgressUc(),
  ];

  constructor(resolve: StreamApiModuleResolver) {
    super();
    this.initResolve(resolve);
  }
}
