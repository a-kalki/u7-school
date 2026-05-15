import type { Status } from '../status';
import type { Course } from './entity';

/** Параметры фильтрации и сортировки списка курсов */
export interface CourseListFilter {
  status?: Status;
  authorId?: string;
  title?: string;
  kind?: 'modules' | 'projects';
  tags?: string[];
  sort?: string;
  limit?: number;
}

/** Интерфейс репозитория курсов */
export interface CourseRepo {
  save(course: Course): Promise<void>;
  getByUuid(uuid: string): Promise<Course | undefined>;
  getAll(filter?: CourseListFilter): Promise<Course[]>;
}
