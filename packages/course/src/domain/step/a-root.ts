import { Aggregate } from "@u7/core/domain";
import { isoNow } from "@u7/core/shared";
import type { CreateStepCmd } from "./commands/create-step-cmd";
import type { Step, StepArMeta } from "./entity";
import { StepSchema } from "./entity";

/**
 * Агрегат Step — шаг урока.
 * Архитектурно выделен в отдельный агрегат, но семантически является частью Course.
 * courseId задаётся при создании и никогда не меняется.
 * Права на редактирование делегируются CoursePolicy.
 */
export class StepAr extends Aggregate<StepArMeta> {
	constructor(state: Step) {
		super(state, StepSchema);
	}

	/**
	 * Фабричный метод создания нового шага из команды.
	 */
	static create(command: CreateStepCmd): StepAr {
		const base = {
			uuid: crypto.randomUUID(),
			courseId: command.courseId,
			description: command.description,
			content: command.content,
			status: command.status,
			order: command.order,
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
				fileId: command.fileId ?? "",
			};
		}

		return new StepAr(candidate);
	}
}
