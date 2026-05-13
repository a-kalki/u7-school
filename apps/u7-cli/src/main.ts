import { ApiApp } from "@u7/core/api";
import { CourseApiModule } from "@u7/course/api";
import { CourseJsonRepo, LessonJsonRepo, StepJsonRepo } from "@u7/course/infra";
import { UserApiModule } from "@u7/user/api";
import { UserInProcFacade, UserJsonRepo } from "@u7/user/infra";
import { CliController } from "./cli-controller";

async function main() {
	// --- User Domain Module ---
	const userRepo = new UserJsonRepo();
	const userApiModule = new UserApiModule();
	userApiModule.init({ userRepo });

	// --- Course Domain Module ---
	const userFacade = new UserInProcFacade(userApiModule);
	const courseApiModule = new CourseApiModule();
	courseApiModule.init({
		courseRepo: new CourseJsonRepo(),
		lessonRepo: new LessonJsonRepo(),
		stepRepo: new StepJsonRepo(),
		userFacade,
	});

	// --- App ---
	const app = new ApiApp();
	app.register(userApiModule);
	app.register(courseApiModule);

	const controller = new CliController(app);
	await controller.run();
}

main().catch(console.error);
