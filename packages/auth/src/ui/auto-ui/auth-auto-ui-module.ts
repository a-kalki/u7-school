import { AutoUiModule } from "@u7/core";
import type { AuthApiModule } from "../../api/auth-module";

export class AuthAutoUiModule extends AutoUiModule<
	{ name: "auth"; url: "/auth" },
	unknown,
	{ apiModule: AuthApiModule; aboutPath?: string }
> {
	readonly name = "auth" as const;
}
