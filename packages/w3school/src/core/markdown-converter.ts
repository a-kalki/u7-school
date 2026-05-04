import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { applyReplacements } from "./sidebar-parser";

const turndownService = new TurndownService({
	headingStyle: "atx",
	codeBlockStyle: "fenced",
});

// Настройка для сохранения блоков кода (портировано из parse_w3s.js)
turndownService.addRule("w3-example", {
	filter: (node) => node.classList.contains("w3-example"),
	replacement: (_content, node) => {
		const code = node.querySelector("pre, .w3-code")?.textContent || "";
		return `\n\`\`\`javascript\n${code.trim()}\n\`\`\`\n`;
	},
});

export function convertToMarkdown(html: string): string {
	const $ = cheerio.load(html);

	let $content = $("#main");
	if ($content.length === 0) $content = $("#mainContent");
	if ($content.length === 0) $content = $("body"); // Fallback для тестов

	// Удаляем ненужные элементы
	$content
		.find(
			".nextprev, #mainLeaderboard, #midcontentadcontainer, .ws-hide-on-logged-in, #auth-bar-container, .pagemenu, script, style, .user-profile-bottom-wrapper, #remoteNameContent",
		)
		.remove();

	const h1 = $content.find("h1").first();
	const pageTitle = h1.length ? h1.text().trim() : "";
	// Мы не удаляем h1 здесь, так как Turndown его обработает,
	// но в оригинале он удалялся и добавлялся вручную в файл.
	// Оставим логику оригинала: удаляем из контента, заголовок вернем в итоговый файл.
	h1.remove();

	let markdown = turndownService.turndown($content.html() || "");
	markdown = applyReplacements(markdown);

	const cleanTitle = applyReplacements(pageTitle);
	return cleanTitle ? `# ${cleanTitle}\n\n${markdown}` : markdown;
}
