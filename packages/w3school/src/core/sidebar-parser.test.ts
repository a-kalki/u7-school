import { describe, expect, test } from "bun:test";
import { parseSidebar } from "./sidebar-parser";

describe("SidebarParser", () => {
	const mockHtml = `
    <div id="leftmenuinnerinner">
      <h2>HTML Basic</h2>
      <a target="_top" href="default.asp">HTML Introduction</a>
      <a target="_top" href="html_editors.asp">HTML Editors</a>
      <h2>HTML Forms</h2>
      <a target="_top" href="html_forms.asp">HTML Forms Intro</a>
    </div>
  `;

	test("should parse sections and lessons correctly", () => {
		const courseName = "html";
		const sections = parseSidebar(mockHtml, courseName);

		expect(sections).toHaveLength(2);
		expect(sections[0].topic).toBe("HTML Basic");
		expect(sections[0].lessons).toHaveLength(2);
		expect(sections[0].lessons[0].title).toBe("HTML Introduction");
		expect(sections[0].lessons[0].url).toBe(
			"https://www.w3schools.com/html/default.asp",
		);
		expect(sections[1].topic).toBe("HTML Forms");
		expect(sections[1].lessons).toHaveLength(1);
	});

	test("should handle missing h2 as 'Introduction' topic", () => {
		const mockHtmlNoH2 = `
      <div id="leftmenuinnerinner">
        <a target="_top" href="default.asp">Intro Lesson</a>
      </div>
    `;
		const sections = parseSidebar(mockHtmlNoH2, "html");
		expect(sections[0].topic).toBe("Introduction");
		expect(sections[0].lessons[0].title).toBe("Intro Lesson");
	});
});
