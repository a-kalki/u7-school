import { describe, expect, test } from "bun:test";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { AutoUiApp } from "@u7/core/ui";
import { UserApiModule } from "@u7/user/api";
import { UserJsonRepo } from "@u7/user/infra";
import { UserAutoUiModule, UserCliController } from "@u7/user/ui";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

describe("u7-cli с UserCliController", () => {
	test("UserCliController инициализируется с AutoUiApp", () => {
		const app = new AutoUiApp([], { aboutPath: rootDir });
		const controller = new UserCliController(app);
		expect(controller).toBeTruthy();
	});

	test("полная интеграция: UserApiModule → UserAutoUiModule → AutoUiApp → UserCliController", async () => {
		const repo = new UserJsonRepo(
			"/tmp/u7-cli-main-test.json",
			"/nonexistent-seed.json",
		);
		const apiModule = new UserApiModule();
		apiModule.init({ userRepo: repo });

		const uiModule = new UserAutoUiModule({
			aboutPath: path.join(rootDir, "..", "..", "packages", "user"),
			apiModule,
		});

		const app = new AutoUiApp([uiModule], { aboutPath: rootDir });
		await app.init();

		const controller = new UserCliController(app);

		expect(uiModule.name).toBe("user");
		expect(controller).toBeTruthy();
		expect(controller.actorId).toBeNull();
	});

	test("UserCliController handleRegister возвращает заголовок регистрации", async () => {
		const repo = new UserJsonRepo(
			"/tmp/u7-cli-main-test2.json",
			"/nonexistent-seed.json",
		);
		const apiModule = new UserApiModule();
		apiModule.init({ userRepo: repo });

		const uiModule = new UserAutoUiModule({
			aboutPath: path.join(rootDir, "..", "..", "packages", "user"),
			apiModule,
		});

		const app = new AutoUiApp([uiModule], { aboutPath: rootDir });
		await app.init();

		const controller = new UserCliController(app);
		const result = await controller.handleRegister();
		expect(result).toContain("Регистрация первого администратора");
	});
});
