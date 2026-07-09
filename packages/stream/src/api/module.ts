import { ApiModule } from '@u7-scl/core/api';
import type {
  StreamApiModuleMeta,
  StreamApiModuleResolver,
} from '#domain/module';
import { ActivateStreamUc } from './stream/activate-stream-uc';
import { ArchiveStreamUc } from './stream/archive-stream-uc';
import { CompleteStreamUc } from './stream/complete-stream-uc';
import { CreateStreamUc } from './stream/create-stream-uc';
import { GetStreamUc } from './stream/get-stream-uc';
import { ListStreamStudentsUc } from './stream/list-stream-students-uc';
import { ListStreamsUc } from './stream/list-streams-uc';
import { CompleteStepUc } from './student/complete-step-uc';
import { CompleteStudentUc } from './student/complete-student-uc';
import { DropStudentUc } from './student/drop-student-uc';
import { EnrollStudentUc } from './student/enroll-student-uc';
import { GetStudentByUserUc } from './student/get-student-by-user-uc';
import { GetStudentProgressUc } from './student/get-student-progress-uc';
import { MarkAbandonedUc } from './student/mark-abandoned-uc';
import { SetNextPreferenceUc } from './student/set-next-preference-uc';

export class StreamApiModule extends ApiModule<
  StreamApiModuleMeta,
  StreamApiModuleResolver
> {
  readonly name = 'stream' as const;
  readonly useCases = [
    new CreateStreamUc(),
    new GetStreamUc(),
    new ListStreamsUc(),
    new ListStreamStudentsUc(),
    new ActivateStreamUc(),
    new CompleteStreamUc(),
    new ArchiveStreamUc(),
    new EnrollStudentUc(),
    new GetStudentByUserUc(),
    new CompleteStepUc(),
    new GetStudentProgressUc(),
    new DropStudentUc(),
    new MarkAbandonedUc(),
    new CompleteStudentUc(),
    new SetNextPreferenceUc(),
  ];

  constructor(resolve: StreamApiModuleResolver) {
    super(resolve);
    this.init();
  }
}
