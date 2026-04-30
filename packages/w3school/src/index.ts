import { readdir } from "node:fs/promises";
import { join } from "node:path";

const EXCLUDED_DIRS = ["css", "images", "libs", "js_lib"];

/**
 * Возвращает список доступных курсов, считывая папки из директории output.
 * Исключает системные папки (css, images и т.д.).
 */
export async function getCourses(): Promise<string[]> {
	const outputDir = join(import.meta.dir, "..", "output");
	try {
		const entries = await readdir(outputDir, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isDirectory() && !EXCLUDED_DIRS.includes(entry.name))
			.map((entry) => entry.name);
	} catch (error) {
		console.error("Ошибка при чтении директории курсов:", error);
		return [];
	}
}
