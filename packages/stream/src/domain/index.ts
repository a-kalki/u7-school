// Будущий экспорт доменного слоя потока курсов
export type { ContentSnapshot } from '@u7-scl/course/domain';
export { ContentSnapshotSchema } from '@u7-scl/course/domain';
export * from './module';
export * from './status';
export * from './stream/a-root';
export * from './stream/entity';
export * from './stream/policy';
export * from './stream/repo';
export * from './stream-ds';
export * from './student/a-root';
export * from './student/entity';
export * from './student/policy';
export * from './student/repo';
export * from './types';
export const STREAM_DOMAIN_VERSION = '1.0.0';
