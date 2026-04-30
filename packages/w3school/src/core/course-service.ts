import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { convertToMarkdown } from "./markdown-converter";
import { parseSidebar } from "./sidebar-parser";
import type { ParserOptions } from "./types";

const EXCLUDE_DIRS = ["lib", "robots.txt"];

export class CourseService {
	constructor(
		private baseDir: string,
		private outputDir: string,
	) {}

	async getAvailableCourses(): Promise<string[]> {
		if (!existsSync(this.baseDir)) return [];

		const entries = await readdir(this.baseDir, { withFileTypes: true });
		return entries
			.filter((dirent) => {
				if (EXCLUDE_DIRS.includes(dirent.name)) return false;
				return dirent.isDirectory();
			})
			.map((dirent) => dirent.name)
			.filter((name) => {
				const coursePath = join(this.baseDir, name);
				return (
					existsSync(join(coursePath, "default.asp.html")) ||
					existsSync(join(coursePath, "index.php.html"))
				);
			});
	}

	async getParsedCourses(): Promise<string[]> {
		if (!existsSync(this.outputDir)) return [];

		const entries = await readdir(this.outputDir, { withFileTypes: true });
		return entries
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name)
			.filter((name) => existsSync(join(this.outputDir, name, "syllabus.json")));
	}

	async getEnrichmentStats(courseName: string): Promise<{ total: number; enriched: number }> {
		const syllabusPath = join(this.outputDir, courseName, "syllabus.json");
		if (!existsSync(syllabusPath)) return { total: 0, enriched: 0 };

		const sections: any[] = JSON.parse(readFileSync(syllabusPath, "utf-8"));
		let total = 0;
		let enriched = 0;

		for (const section of sections) {
			for (const lesson of section.lessons) {
				total++;
				if (lesson.summary) enriched++;
			}
		}

		return { total, enriched };
	}

	async parseCourse(
		courseName: string,
		options: ParserOptions = {},
	): Promise<void> {
		const coursePath = join(this.baseDir, courseName);
		const courseOutDir = join(this.outputDir, courseName);

		if (options.force && existsSync(courseOutDir)) {
			await rm(courseOutDir, { recursive: true, force: true });
		}

		if (!existsSync(courseOutDir)) {
			await mkdir(courseOutDir, { recursive: true });
		}

		const indexFile = existsSync(join(coursePath, "default.asp.html"))
			? "default.asp.html"
			: existsSync(join(coursePath, "index.php.html"))
				? "index.php.html"
				: null;

		if (!indexFile) {
			console.warn(`[!] Файл индекса не найден для ${courseName}`);
			return;
		}

		const html = readFileSync(join(coursePath, indexFile), "utf-8");
		const sections = parseSidebar(html, courseName);

		for (const section of sections) {
			for (const lesson of section.lessons) {
				const originalFile = decodeURIComponent(lesson.originalFile);
				let lessonFilePath = join(coursePath, originalFile);

				if (!existsSync(lessonFilePath)) {
					if (existsSync(`${lessonFilePath}.html`)) {
						lessonFilePath += ".html";
					} else {
						continue;
					}
				}

				let outFileName = lesson.fileName;
				if (outFileName.includes(".")) {
					outFileName = `${outFileName.substring(0, outFileName.lastIndexOf("."))}.md`;
				} else {
					outFileName += ".md";
				}

				const fullOutPath = join(courseOutDir, outFileName);

				if (options.onlyNew && existsSync(fullOutPath)) {
					lesson.fileName = outFileName;
					continue;
				}

				const lessonHtml = readFileSync(lessonFilePath, "utf-8");
				const markdown = convertToMarkdown(lessonHtml);

				writeFileSync(fullOutPath, markdown);
				lesson.fileName = outFileName;
			}
		}

		// Сохранение syllabus.json - только разрешенные поля
		const cleanedSections = sections.map((section) => ({
			topic: section.topic,
			lessons: section.lessons
				.filter((l) => l.fileName.endsWith(".md")) // Только те, что реально спарсили
				.map((l) => ({
					title: l.title,
					fileName: l.fileName,
					url: l.url,
					...(l.summary ? { summary: l.summary } : {}),
				})),
		}));

		writeFileSync(
			join(courseOutDir, "syllabus.json"),
			JSON.stringify(cleanedSections, null, 2),
		);

		// Генерация README
		let readme = `# ${courseName.toUpperCase()} Course\n\n`;
		for (const section of cleanedSections) {
			readme += `## ${section.topic}\n`;
			for (const lesson of section.lessons) {
				readme += `- [${lesson.title}](${lesson.fileName}) ([Original](${lesson.url}))\n`;
			}
			readme += "\n";
		}
		writeFileSync(join(courseOutDir, "README.md"), readme);
	}
}
