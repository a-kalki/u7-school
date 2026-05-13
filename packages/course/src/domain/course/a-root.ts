import { Aggregate } from "@u7/core/domain";
import { isoNow } from "@u7/core/shared";
import type { User } from "@u7/user/domain";
import { Status } from "../status";
import type { AddModuleCmd } from "./commands/add-module-cmd";
import type { AddProjectCmd } from "./commands/add-project-cmd";
import type { EnrichCourseCmd } from "./commands/enrich-course-cmd";
import type { Course, CourseArMeta, Module, Project } from "./entity";
import { CourseSchema } from "./entity";
import { CoursePolicy } from "./policy";

/**
 * Агрегат Course — корень образовательного курса.
 * Module и Project — value-objects (без своих createdAt/updatedAt).
 */
export class CourseAr extends Aggregate<CourseArMeta> {
	static readonly arName = "Course";
	static readonly arLabel = "Курс";

	constructor(state: Course) {
		super(state, CourseSchema);
	}

	/** Этап 1: создание базового курса. */
	static create(
		title: string,
		description: string,
		kind: "modules" | "projects",
		authorId: string,
	): CourseAr {
		const base = {
			uuid: crypto.randomUUID(),
			title,
			description,
			authorId,
			tags: [],
			status: Status.DRAFT,
			createdAt: isoNow(),
		};

		let candidate: Course;
		if (kind === "modules") {
			candidate = { ...base, kind: "modules", modules: [] };
		} else {
			candidate = { ...base, kind: "projects", projects: [] };
		}

		return new CourseAr(candidate);
	}

	/** Этап 2: обогащение дополнительными полями. */
	enrich(command: EnrichCourseCmd): void {
		this.safeUpdate({
			targetAudience: command.targetAudience,
			goal: command.goal,
			result: command.result,
			rules: command.rules,
			additional: command.additional,
			tags: command.tags,
		});
	}

	/** Этап 3a: добавить модуль (kind="modules"). */
	addModule(command: AddModuleCmd): void {
		if (this.state.kind !== "modules") {
			this.throwInternal("Нельзя добавить модуль в курс с kind='projects'");
		}

		const module: Module = {
			uuid: crypto.randomUUID(),
			title: command.title,
			goal: command.goal,
			result: command.result,
			additional: command.additional,
			status: Status.DRAFT,
			projects: [],
		};

		(this._state as Course & { kind: "modules" }).modules.push(module);
		this.safeUpdate({});
	}

	/** Этап 3b: добавить проект (kind="projects"). */
	addProject(command: AddProjectCmd): void {
		if (this.state.kind !== "projects") {
			this.throwInternal("Нельзя добавить проект в курс с kind='modules'");
		}

		const project: Project = {
			uuid: crypto.randomUUID(),
			title: command.title,
			goal: command.goal,
			result: command.result,
			additional: command.additional,
			status: Status.DRAFT,
			lessonIds: [],
		};

		(this._state as Course & { kind: "projects" }).projects.push(project);
		this.safeUpdate({});
	}

	/** Этап 4: публикация всего курса. */
	publish(): void {
		this._state.status = Status.PUBLISHED;
		this.safeUpdate({});
	}

	/**
	 * Добавить проект в конкретный модуль (kind="modules").
	 */
	addProjectToModule(moduleUuid: string, command: AddProjectCmd): void {
		if (this.state.kind !== "modules") {
			this.throwInternal(
				"Нельзя добавить проект в модуль курса с kind='projects'",
			);
		}

		const modules = (this._state as Course & { kind: "modules" }).modules;
		const mod = modules.find((m) => m.uuid === moduleUuid);
		if (!mod) this.throwBadRequest("Модуль не найден");

		const project: Project = {
			uuid: crypto.randomUUID(),
			title: command.title,
			goal: command.goal,
			result: command.result,
			additional: command.additional,
			status: Status.DRAFT,
			lessonIds: [],
		};

		mod.projects.push(project);
		this.safeUpdate({});
	}

	/** Публикация модуля (kind="modules"). */
	publishModule(moduleUuid: string): void {
		if (this.state.kind !== "modules") {
			this.throwInternal(
				"Нельзя опубликовать модуль в курсе с kind='projects'",
			);
		}

		const mod = (this._state as Course & { kind: "modules" }).modules.find(
			(m) => m.uuid === moduleUuid,
		);
		if (!mod) this.throwBadRequest("Модуль не найден");
		mod.status = Status.PUBLISHED;
		this.safeUpdate({});
	}

	/**
	 * Публикация проекта. Работает для обоих kind:
	 * - kind="projects": ищет в корневых проектах
	 * - kind="modules": ищет во всех модулях
	 */
	publishProject(projectUuid: string): void {
		const project = this.getProject(projectUuid);
		if (!project) this.throwBadRequest("Проект не найден в курсе");
		project.status = Status.PUBLISHED;
		this.safeUpdate({});
	}

	/**
	 * Добавляет lessonId в проект. Работает для обоих kind через getProject.
	 */
	addLessonToProject(projectId: string, lessonId: string): void {
		const project = this.getProject(projectId);
		if (!project) this.throwBadRequest("Проект не найден в курсе");
		project.lessonIds.push(lessonId);
		this.safeUpdate({});
	}

	/**
	 * Возвращает уроки проекта.
	 * Если проект не найден — ошибка запроса (bad request).
	 */
	getLessons(projectId: string): string[] {
		const project = this.getProject(projectId);
		if (!project) this.throwBadRequest("Проект не найден в курсе");
		return project.lessonIds;
	}

	// ════════════════════ утилиты ════════════════════

	/**
	 * Находит проект по UUID в любом месте курса.
	 * - kind="projects": ищет в корневых проектах
	 * - kind="modules": ищет во всех модулях
	 */
	getProject(projectId: string): Project | undefined {
		const s = this._state;
		if (s.kind === "projects") {
			return (s as Course & { kind: "projects" }).projects.find(
				(p) => p.uuid === projectId,
			);
		}
		for (const mod of (s as Course & { kind: "modules" }).modules) {
			const found = mod.projects.find((p) => p.uuid === projectId);
			if (found) return found;
		}
		return undefined;
	}

	/**
	 * Курс, видимый актору (или null).
	 */
	getVisibleFor(actor?: User): Course | null {
		if (!actor) {
			if (this.state.status !== Status.PUBLISHED) return null;
			return this.#filterPublished();
		}

		if (!CoursePolicy.canRead(actor, this.state)) return null;
		if (CoursePolicy.isAdminOrAuthor(actor, this.state)) return this.state;

		return this.#filterPublished();
	}

	#filterPublished(): Course {
		if (this.state.kind === "modules") {
			return {
				...this.state,
				modules: this.state.modules
					.filter((m) => m.status === Status.PUBLISHED)
					.map((m) => ({
						...m,
						projects: m.projects.filter((p) => p.status === Status.PUBLISHED),
					})),
			} satisfies Course;
		}
		return {
			...this.state,
			projects: this.state.projects.filter(
				(p) => p.status === Status.PUBLISHED,
			),
		} satisfies Course;
	}
}
