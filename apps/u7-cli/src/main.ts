import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
	AuthApiModule,
	AuthAutoUiModule,
	InMemoryUserRepository,
} from "@u7/auth";
import { AutoUiApp, AutoUiConsoleController } from "@u7/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function main() {
	// --- Auth Domain Module ---
	const userRepo = new InMemoryUserRepository();
	const apiModule = new AuthApiModule();
	apiModule.init({ userRepo });

	// Auth module about.md
	const authModDir = path.join(rootDir, "..", "..", "packages", "auth");

	const uiModule = new AuthAutoUiModule({
		aboutPath: authModDir,
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
