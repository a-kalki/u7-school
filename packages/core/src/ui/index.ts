// UI слой @u7/core
export { AutoUiApp } from "./auto-ui/app/auto-ui-app";
export { AutoUiModule } from "./auto-ui/module/auto-ui-module";
export type { AutoUiModuleResolver } from "./auto-ui/module/auto-ui-module";
export { CommandParser } from "./auto-ui/parser/command-parser";
export { AutoUiConsoleController } from "./auto-ui/controller/console-controller";
export { formatValibotErrors } from "./auto-ui/controller/format-valibot-errors";
export { UIApp, type UIAppResolver } from "./ui-base/ui-app";
export { UIModule, type UIModuleResolver } from "./ui-base/ui-module";
export { loadAboutFile, parseAboutMarkdown, type AboutData } from "./shared/about-parser";
