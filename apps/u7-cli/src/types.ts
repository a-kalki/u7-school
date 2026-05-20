import type { UserApiModuleMeta } from '@u7-scl/user/domain';
import type { CourseApiModuleMeta } from 'packages/course/src/domain';

export interface CliAppMeta {
  name: 'u7-cli';
  moduleMetas: UserApiModuleMeta | CourseApiModuleMeta;
}
