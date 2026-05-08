import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { AutoUiApp } from "@u7/core/ui";
import { UserApiModule } from "@u7/user/api";
import { UserInmemoryRepo } from "@u7/user/infra";
import { UserAutoUiModule, UserCliController } from "@u7/user/ui";

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

	const controller = new UserCliController(app);
	await controller.run();
}

main().catch(console.error);
