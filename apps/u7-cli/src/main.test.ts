import { describe, expect, test } from "bun:test";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
	UserApiModule,
	UserAutoUiModule,
	UserInmemoryRepo,
} from "@u7/user";
import { AutoUiApp } from "@u7/core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

describe("u7-cli с user модулем", () => {
	test("можно создать и инициализировать UserApiModule", () => {
		const repo = new UserInmemoryRepo();
		const mod = new UserApiModule();
		mod.init({ userRepo: repo });
		expect(mod.name).toBe("user");
		expect(mod.useCases).toHaveLength(4);
	});

	test("UserAutoUiModule корректно привязан к UserApiModule", async () => {
		const repo = new UserInmemoryRepo();
		const apiModule = new UserApiModule();
		apiModule.init({ userRepo: repo });

		const uiModule = new UserAutoUiModule({
			aboutPath: path.join(rootDir, "..", "..", "packages", "user"),
			apiModule,
		});

		const app = new AutoUiApp([uiModule], { aboutPath: rootDir });
		await app.init();

		expect(uiModule.name).toBe("user");
	});
});
