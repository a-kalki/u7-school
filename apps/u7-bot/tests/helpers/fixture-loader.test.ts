import { describe, expect, it } from 'bun:test';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { cleanupFixtures, loadFixtures } from './fixture-loader';

describe('FixtureLoader (powered by Test Worlds)', () => {
  it('создает изолированные копии для разных тегов', async () => {
    const f1 = await loadFixtures('test-tag-1');
    const f2 = await loadFixtures('test-tag-2');

    expect(f1.dbDir).not.toBe(f2.dbDir);
    expect(existsSync(f1.users)).toBe(true);
    expect(existsSync(f2.users)).toBe(true);

    // Модификация копии 1 не затрагивает копию 2
    await writeFile(f1.users, JSON.stringify([{ modified: true }]));
    const content2 = await readFile(f2.users, 'utf-8');
    expect(content2).not.toContain('modified');

    await cleanupFixtures(f1);
    await cleanupFixtures(f2);

    expect(existsSync(f1.dbDir)).toBe(false);
    expect(existsSync(f2.dbDir)).toBe(false);
  });

  it('предоставляет все ожидаемые пути и сущности', async () => {
    const fixtures = await loadFixtures('schema-check');

    expect(existsSync(fixtures.streams)).toBe(true);
    expect(existsSync(fixtures.students)).toBe(true);
    expect(existsSync(fixtures.courses.courses)).toBe(true);
    expect(existsSync(fixtures.courses.modules)).toBe(true);
    expect(existsSync(fixtures.courses.lessons)).toBe(true);
    expect(existsSync(fixtures.courses.steps)).toBe(true);
    expect(existsSync(fixtures.peerReview.campaigns)).toBe(true);
    expect(existsSync(fixtures.peerReview.reviews)).toBe(true);

    const users = JSON.parse(await readFile(fixtures.users, 'utf-8'));
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);

    await cleanupFixtures(fixtures);
  });
});
