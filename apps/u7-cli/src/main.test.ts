import { describe, expect, test } from "bun:test";
import { AuthApiModule, AuthAutoUiModule, InMemoryUserRepository } from "@u7/auth";
import { AutoUiApp } from "@u7/core";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

describe("u7-cli с auth модулем", () => {
	test("можно создать и инициализировать AuthApiModule", () => {
		const repo = new InMemoryUserRepository();
		const mod = new AuthApiModule();
		mod.init({ userRepo: repo });
		expect(mod.name).toBe("auth");
		expect(mod.useCases).toHaveLength(4);
	});

	test("AuthAutoUiModule корректно привязан к AuthApiModule", async () => {
		const repo = new InMemoryUserRepository();
		const apiModule = new AuthApiModule();
		apiModule.init({ userRepo: repo });

		const uiModule = new AuthAutoUiModule({
			aboutPath: path.join(rootDir, "..", "..", "packages", "auth"),
			apiModule,
		});

		const app = new AutoUiApp([uiModule], { aboutPath: rootDir });
		await app.init();

		expect(uiModule.name).toBe("auth");
	});
});
