import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Questionnaire } from '#domain/questionnaire/entity';
import { QuestionnaireJsonRepo } from './questionnaire-json-repo';

let tmpDir: string;

function nextPath(): string {
  return join(tmpDir, `${crypto.randomUUID()}.json`);
}

function makeQuestionnaire(overrides?: Partial<Questionnaire>): Questionnaire {
  return {
    uuid: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    status: 'in_progress',
    answers: [],
    currentQuestionCode: 'q1',
    createdAt: '2024-01-01T00:00',
    ...overrides,
  };
}

describe('QuestionnaireJsonRepo', () => {
  let repo: QuestionnaireJsonRepo;

  beforeEach(() => {
    tmpDir = mkdtempSync('/tmp/onboarding-questionnaire-repo-test-');
    repo = new QuestionnaireJsonRepo(nextPath());
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('save', () => {
    test('сохраняет анкету', async () => {
      const q = makeQuestionnaire();
      await repo.save(q);
      const found = await repo.getByUuid(q.uuid);
      expect(found).toEqual(q);
    });

    test('перезаписывает существующую анкету', async () => {
      const q = makeQuestionnaire();
      await repo.save(q);

      const updated = { ...q, status: 'completed' as const };
      await repo.save(updated);

      const found = await repo.getByUuid(q.uuid);
      expect(found?.status).toBe('completed');
    });
  });

  describe('getByUuid', () => {
    test('возвращает анкету по uuid', async () => {
      const q = makeQuestionnaire();
      await repo.save(q);
      const found = await repo.getByUuid(q.uuid);
      expect(found).toEqual(q);
    });

    test('возвращает undefined для несуществующего uuid', async () => {
      const found = await repo.getByUuid('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('getByUserId', () => {
    test('возвращает анкеты пользователя', async () => {
      const userId = crypto.randomUUID();
      const q1 = makeQuestionnaire({ userId });
      const q2 = makeQuestionnaire({ userId });
      const q3 = makeQuestionnaire();
      await repo.save(q1);
      await repo.save(q2);
      await repo.save(q3);

      const found = await repo.getByUserId(userId);
      expect(found).toHaveLength(2);
      expect(found.map((q) => q.uuid)).toContain(q1.uuid);
      expect(found.map((q) => q.uuid)).toContain(q2.uuid);
    });

    test('возвращает пустой массив для несуществующего userId', async () => {
      const found = await repo.getByUserId('non-existent');
      expect(found).toEqual([]);
    });
  });
});
