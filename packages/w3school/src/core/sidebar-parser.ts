import * as cheerio from "cheerio";
import type { Lesson, Section } from "./types";

const W3S_URL = "https://www.w3schools.com";

// Карта замен для плейсхолдеров (портировано из parse_w3s.js)
const replacements: Record<string, string> = {
	"{{title}}": "GitHub",
	"{{remoteName}}": "github",
};

export function applyReplacements(text: string): string {
	let result = text;
	for (const [key, value] of Object.entries(replacements)) {
		result = result.split(key).join(value);
	}
	return result;
}

export function parseSidebar(
	html: string,
	courseName: string,
): (Section & { lessons: (Lesson & { originalFile: string })[] })[] {
	const $ = cheerio.load(html);
	const sections: any[] = [];
	let currentSection: any | null = null;

	$("#leftmenuinnerinner")
		.children()
		.each((_, el) => {
			const $el = $(el);

			if ($el.is("h2")) {
				currentSection = {
					topic: applyReplacements($el.text().trim()),
					lessons: [],
				};
				sections.push(currentSection);
			} else if ($el.is("a") && $el.attr("target") === "_top") {
				const href = $el.attr("href") || "";

				// Игнорируем внешние ссылки и ссылки на другие разделы (содержащие / или ://)
				if (href.includes("/") || href.includes("://")) {
					return;
				}

				if (!currentSection) {
					currentSection = { topic: "Introduction", lessons: [] };
					sections.push(currentSection);
				}

				const cleanName = (href.split("?")[0] ?? "").replace(/%3F.*/, "");
				const lessonTitle = applyReplacements($el.text().trim());

				currentSection.lessons.push({
					title: lessonTitle,
					originalFile: href,
					fileName: cleanName, // CourseService заменит на .md
					url: `${W3S_URL}/${courseName}/${cleanName}`,
				});
			}
		});

	return sections;
}
