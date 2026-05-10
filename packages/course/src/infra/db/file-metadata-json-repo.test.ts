import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { FileMetadata } from "#domain/file-metadata/entity";
import { FileMetadataJsonRepo } from "./file-metadata-json-repo";

const tmpDir = mkdtempSync("/tmp/filemeta-repo-test-");

function filePath(): string {
	return join(tmpDir, "files.json");
}

function makeFile(overrides: Partial<FileMetadata> = {}): FileMetadata {
	return {
		uuid: crypto.randomUUID(),
		courseId: crypto.randomUUID(),
		name: "test.pdf",
		url: "https://example.com/test.pdf",
		mimeType: "application/pdf",
		createdAt: "2026-05-01T12:00",
		...overrides,
	};
}

describe("FileMetadataJsonRepo", () => {
	afterAll(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	test("save и getByUuid", async () => {
		const repo = new FileMetadataJsonRepo(filePath());
		const uuid = crypto.randomUUID();
		const file = makeFile({ uuid });

		await repo.save(file);
		const found = await repo.getByUuid(uuid);

		expect(found).toBeDefined();
		expect(found?.name).toBe("test.pdf");
	});

	test("getByIds возвращает файлы по списку ID", async () => {
		const repo = new FileMetadataJsonRepo(join(tmpDir, "files-ids.json"));
		const id1 = crypto.randomUUID();
		const id2 = crypto.randomUUID();
		const f1 = makeFile({ uuid: id1, name: "a.pdf" });
		const f2 = makeFile({ uuid: id2, name: "b.pdf" });

		await repo.save(f1);
		await repo.save(f2);

		const result = await repo.getByIds([id1, id2]);
		expect(result).toHaveLength(2);
	});
});
