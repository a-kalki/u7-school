import { AutoUiModule } from "@u7/core";

export class AuthAutoUiModule extends AutoUiModule<{
	name: "auth";
	url: "/auth";
}> {
	readonly name = "auth" as const;
}
