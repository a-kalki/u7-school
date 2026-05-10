import { JsonFileRepo } from "@u7/core/infra";
import type { Course } from "#domain/course/entity";
import { CourseSchema } from "#domain/course/entity";
import type { CourseListFilter, CourseRepo } from "#domain/course/repo";

/**
 * JSON-файловая реализация репозитория курсов.
 * Хранит данные в JSON-файле через {@link JsonFileRepo}.
 */
export class CourseJsonRepo implements CourseRepo {
	readonly #repo: JsonFileRepo<Course>;

	constructor(filePath = "data/courses/courses.json") {
		this.#repo = new JsonFileRepo(CourseSchema, filePath);
	}

	async save(course: Course): Promise<void> {
		const all = await this.#repo.readAll();
		const idx = all.findIndex((c) => c.uuid === course.uuid);
		if (idx !== -1) {
			all[idx] = course;
		} else {
			all.push(course);
		}
		await this.#repo.writeAll(all);
	}

	async getByUuid(uuid: string): Promise<Course | undefined> {
		const all = await this.#repo.readAll();
		return all.find((c) => c.uuid === uuid);
	}

	async getAll(filter?: CourseListFilter): Promise<Course[]> {
		let courses = await this.#repo.readAll();

		if (filter) {
			if (filter.status) {
				courses = courses.filter((c) => c.status === filter.status);
			}
			if (filter.authorId) {
				courses = courses.filter((c) => c.authorId === filter.authorId);
			}
			if (filter.title) {
				const lower = filter.title.toLowerCase();
				courses = courses.filter((c) => c.title.toLowerCase().includes(lower));
			}
			if (filter.kind) {
				courses = courses.filter((c) => c.kind === filter.kind);
			}
			if (filter.tags && filter.tags.length > 0) {
				courses = courses.filter((c) =>
					c.tags?.some((t) => filter.tags?.includes(t)),
				);
			}
			if (filter.sort) {
				const [field, dir] = filter.sort.split(":") as [
					"createdAt" | "title",
					"asc" | "desc",
				];
				const m = dir === "asc" ? 1 : -1;
				courses.sort((a, b) => {
					const va = a[field];
					const vb = b[field];
					// biome-ignore lint/style/noNonNullAssertion: guaranteed by split
					if (va! < vb!) return -1 * m;
					// biome-ignore lint/style/noNonNullAssertion: guaranteed by split
					if (va! > vb!) return 1 * m;
					return 0;
				});
			}
			if (filter.limit !== undefined) {
				courses = courses.slice(0, filter.limit);
			}
		}

		return courses;
	}
}
