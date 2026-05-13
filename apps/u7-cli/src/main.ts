import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { AutoUiApp } from "@u7/core/ui";
import { CourseApiModule } from "@u7/course/api";
import { CourseJsonRepo, LessonJsonRepo, StepJsonRepo } from "@u7/course/infra";
import { CourseAutoUiModule } from "@u7/course/ui";
import { UserApiModule } from "@u7/user/api";
import { UserInProcFacade, UserJsonRepo } from "@u7/user/infra";
import { UserAutoUiModule, UserCliController } from "@u7/user/ui";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function main() {
	// --- User Domain Module ---
	const userRepo = new UserJsonRepo();
	const userApiModule = new UserApiModule();
	userApiModule.init({ userRepo });

	const userModDir = path.join(rootDir, "..", "..", "packages", "user");

	const userUiModule = new UserAutoUiModule({
		aboutPath: userModDir,
		apiModule: userApiModule,
	});

	// --- Course Domain Module ---
	const userFacade = new UserInProcFacade(userApiModule);
	const courseApiModule = new CourseApiModule();
	courseApiModule.init({
		courseRepo: new CourseJsonRepo(),
		lessonRepo: new LessonJsonRepo(),
		stepRepo: new StepJsonRepo(),
		userFacade,
	});

	const courseModDir = path.join(rootDir, "..", "..", "packages", "course");

	const courseUiModule = new CourseAutoUiModule({
		aboutPath: courseModDir,
		apiModule: courseApiModule,
	});

	// --- App ---
	const app = new AutoUiApp([userUiModule, courseUiModule], {
		aboutPath: rootDir,
	});

	await app.init();

	const controller = new UserCliController(app);
	await controller.run();
}

main().catch(console.error);
