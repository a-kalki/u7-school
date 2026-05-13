import { AutoUiModule } from "@u7/core/ui";
import type { UserModuleMeta } from "#domain/module";

export class UserAutoUiModule extends AutoUiModule<UserModuleMeta> {
	readonly name = "user" as const;
}
