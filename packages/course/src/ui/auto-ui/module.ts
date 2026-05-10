import { AutoUiModule } from "@u7/core/ui";
import type { CourseModuleMeta } from "#domain/module";

export class CourseAutoUiModule extends AutoUiModule<CourseModuleMeta> {
	readonly name = "course" as const;
}
