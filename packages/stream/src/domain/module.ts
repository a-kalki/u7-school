import type { UserFacade } from '@u7-scl/user/domain';
import type { CourseFacade } from '../../../course/src/domain/facade';
import type { StreamRepo } from './stream/repo';
import type { StreamStudentRepo } from './stream-student/repo';

export interface StreamApiModuleResolver {
  streamRepo: StreamRepo;
  streamStudentRepo: StreamStudentRepo;
  userFacade: UserFacade;
  courseFacade: CourseFacade;
}

export interface StreamApiModuleMeta {
  name: 'stream';
}
