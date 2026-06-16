import type { ModuleResolver } from '@u7-scl/core/domain';
import type { CourseFacade } from '@u7-scl/course/domain';
import type { UserApiModuleMeta, UserFacade } from '@u7-scl/user/domain';
import type { ActivateStreamCmdMeta } from './stream/commands/activate-stream-cmd';
import type { ArchiveStreamCmdMeta } from './stream/commands/archive-stream-cmd';
import type { CompleteStreamCmdMeta } from './stream/commands/complete-stream-cmd';
import type { CreateStreamCmdMeta } from './stream/commands/create-stream-cmd';
import type { GetStreamCmdMeta } from './stream/commands/get-stream-cmd';
import type { ListStreamStudentsCmdMeta } from './stream/commands/list-stream-students-cmd';
import type { ListStreamsCmdMeta } from './stream/commands/list-streams-cmd';
import type { StreamRepo } from './stream/repo';
import type { CompleteStepCmdMeta } from './student/commands/complete-step-cmd';
import type { EnrollStudentCmdMeta } from './student/commands/enroll-student-cmd';
import type { GetStudentByUserCmdMeta } from './student/commands/get-student-by-user-cmd';
import type { GetStudentProgressCmdMeta } from './student/commands/get-student-progress-cmd';
import type { StudentRepo } from './student/repo';

export interface StreamApiModuleResolver extends ModuleResolver {
  streamRepo: StreamRepo;
  streamStudentRepo: StudentRepo;
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
    | ListStreamStudentsCmdMeta
    | GetStreamCmdMeta
    | CompleteStepCmdMeta
    | EnrollStudentCmdMeta
    | GetStudentByUserCmdMeta
    | GetStudentProgressCmdMeta;
}


