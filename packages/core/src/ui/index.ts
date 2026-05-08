// UI слой @u7/core
export { AutoUiApp } from "./auto-ui/app/auto-ui-app";
export { AutoUiController } from "./auto-ui/controller/base";
export { AutoUiCliController } from "./auto-ui/controller/cli";
export { formatValibotErrors } from "./auto-ui/controller/format-valibot-errors";
export type { AutoUiModuleResolver } from "./auto-ui/module/auto-ui-module";
export { AutoUiModule } from "./auto-ui/module/auto-ui-module";
export { CommandParser } from "./auto-ui/parser/command-parser";
export {
	type AboutData,
	loadAboutFile,
	parseAboutMarkdown,
} from "./shared/about-parser";
export { UIApp, type UIAppResolver } from "./ui-base/ui-app";
export { UIModule, type UIModuleResolver } from "./ui-base/ui-module";
