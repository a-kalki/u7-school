import type { UserApiModuleMeta } from '@u7/user/domain';
import type { CourseApiModuleMeta } from 'packages/course/src/domain';

export interface CliAppMeta {
  name: 'u7-cli';
  moduleMetas: UserApiModuleMeta | CourseApiModuleMeta;
}
