import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
	UserApiModule,
	UserAutoUiModule,
	UserInmemoryRepo,
} from "@u7/user";
import { AutoUiApp, AutoUiConsoleController } from "@u7/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function main() {
	// --- User Domain Module ---
	const userRepo = new UserInmemoryRepo();
	const apiModule = new UserApiModule();
	apiModule.init({ userRepo });

	const userModDir = path.join(rootDir, "..", "..", "packages", "user");

	const uiModule = new UserAutoUiModule({
		aboutPath: userModDir,
		apiModule,
	});

	const app = new AutoUiApp([uiModule], {
		aboutPath: rootDir,
	});

	await app.init();

	const controller = new AutoUiConsoleController(app);
	await controller.run();
}

main().catch(console.error);
