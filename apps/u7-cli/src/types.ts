import type { CourseApiModuleMeta } from '@u7-scl/course/domain';
import type { UserApiModuleMeta } from '@u7-scl/user/domain';

export interface CliAppMeta {
  name: 'u7-cli';
  moduleMetas: UserApiModuleMeta | CourseApiModuleMeta;
}
