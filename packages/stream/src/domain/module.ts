import type { UserFacade } from '@u7-scl/user/domain';
import type { CourseFacade } from '../../../course/src/domain/facade';
import type { ActivateStreamCmdMeta } from './stream/commands/activate-stream-cmd';
import type { ArchiveStreamCmdMeta } from './stream/commands/archive-stream-cmd';
import type { CompleteStreamCmdMeta } from './stream/commands/complete-stream-cmd';
import type { CreateStreamCmdMeta } from './stream/commands/create-stream-cmd';
import type { ListStreamsCmdMeta } from './stream/commands/list-streams-cmd';
import type { StreamRepo } from './stream/repo';
import type { CompleteStepCmdMeta } from './stream-student/commands/complete-step-cmd';
import type { EnrollStudentCmdMeta } from './stream-student/commands/enroll-student-cmd';
import type { StreamStudentRepo } from './stream-student/repo';

export interface StreamApiModuleResolver {
  streamRepo: StreamRepo;
  streamStudentRepo: StreamStudentRepo;
  userFacade: UserFacade;
  courseFacade: CourseFacade;
}

export interface StreamApiModuleMeta {
  name: 'stream';
  url: '/stream';
  ucMetas:
  | ActivateStreamCmdMeta
  | ArchiveStreamCmdMeta
  | CompleteStreamCmdMeta
  | CreateStreamCmdMeta
  | ListStreamsCmdMeta
  | CompleteStepCmdMeta
  | EnrollStudentCmdMeta;
}
