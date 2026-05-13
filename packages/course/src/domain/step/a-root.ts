import { Aggregate } from "@u7/core/domain";
import { isoNow } from "@u7/core/shared";
import type { User } from "@u7/user/domain";
import type { Course } from "../course/entity";
import { CoursePolicy } from "../course/policy";
import { Status } from "../status";
import type { CreateStepCmd } from "./commands/create-step-cmd";
import type { Step, StepArMeta } from "./entity";
import { StepSchema } from "./entity";

/**
 * Агрегат Step — шаг урока.
 */
export class StepAr extends Aggregate<StepArMeta> {
	static readonly arName = "Step";
	static readonly arLabel = "Шаг";

	constructor(state: Step) {
		super(state, StepSchema);
	}

	static create(command: CreateStepCmd): StepAr {
		const base = {
			uuid: crypto.randomUUID(),
			courseId: command.courseId,
			description: command.description,
			content: command.content,
			status: Status.DRAFT,
			createdAt: isoNow(),
		};

		let candidate: Step;
		if (command.kind === "text") {
			candidate = { ...base, kind: "text" };
		} else if (command.kind === "code") {
			candidate = {
				...base,
				kind: "code",
				code: command.code ?? "",
				language: command.language,
			};
		} else {
			candidate = {
				...base,
				kind: "file",
				file: {
					uuid: crypto.randomUUID(),
					name: command.fileName ?? "",
					mimeType: command.fileMimeType ?? "application/octet-stream",
					size: command.fileSize ?? 0,
					description: command.fileDescription,
				},
			};
		}

		return new StepAr(candidate);
	}

	/**
	 * Возвращает шаг, если он доступен для чтения данному актору.
	 * null — если шаг недоступен.
	 */
	getVisibleFor(actor: User | undefined, course: Course): Step | null {
		if (!actor) {
			return this.state.status === Status.PUBLISHED ? this.state : null;
		}
		if (CoursePolicy.isAdminOrAuthor(actor, course)) return this.state;
		return this.state.status === Status.PUBLISHED ? this.state : null;
	}
}
