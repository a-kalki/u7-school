import type { Course } from './entity';

/** Интерфейс репозитория курсов */
export interface CourseRepo {
  save(course: Course): Promise<void>;
  getByUuid(uuid: string): Promise<Course | undefined>;
  getAll(): Promise<Course[]>;
}
