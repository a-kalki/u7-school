import type { Lesson } from "./entity";

/** Интерфейс репозитория уроков */
export interface LessonRepo {
	save(lesson: Lesson): Promise<void>;
	getByUuid(uuid: string): Promise<Lesson | undefined>;
	getByIds(ids: string[]): Promise<Lesson[]>;
}
