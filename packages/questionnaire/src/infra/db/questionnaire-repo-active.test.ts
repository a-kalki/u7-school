import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Questionnaire } from '../../domain/questionnaire/entity';
import { QuestionnaireJsonRepo } from './questionnaire-json-repo';

describe('QuestionnaireRepo.getActive (брошенные анкеты)', () => {
  let tmpDir: string;
  let repo: QuestionnaireJsonRepo;

  beforeEach(() => {
    tmpDir = mkdtempSync('/tmp/questionnaire-active-test-');
    repo = new QuestionnaireJsonRepo(join(tmpDir, 'questionnaires.json'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  const makeQ = (overrides: Partial<Questionnaire> = {}): Questionnaire => ({
    kind: 'standard',
    uuid: crypto.randomUUID(),
    respondentId: '00000000-0000-0000-0000-000000000001',
    status: 'in_progress',
    currentQuestionCode: 'q1',
    draftAnswers: {},
    answers: [],
    questionPool: {
      questions: [
        {
          question: 'Q1',
          questionCode: 'q1',
          type: 'choice' as const,
          multiple: false,
          answers: [{ answer: 'A', answerCode: 'a' }],
        },
      ],
    },
    ownerInfo: {},
    createdAt: '2024-01-01T00:00',
    completedAt: null,
    ...overrides,
  });

  test('возвращает только анкеты в статусе in_progress', async () => {
    await repo.save(makeQ({ status: 'in_progress' }));
    await repo.save(makeQ({ status: 'invited', currentQuestionCode: null }));
    await repo.save(
      makeQ({ status: 'completed', completedAt: '2024-01-02T00:00' }),
    );
    await repo.save(makeQ({ status: 'abandoned' }));
    await repo.save(makeQ({ status: 'in_progress' }));

    const active = await repo.getActive();

    expect(active).toHaveLength(2);
    for (const q of active) {
      expect(q.status).toBe('in_progress');
    }
  });

  test('возвращает пустой массив, если активных нет', async () => {
    await repo.save(makeQ({ status: 'abandoned' }));

    const active = await repo.getActive();

    expect(active).toEqual([]);
  });

  test('возвращает пустой массив на пустом хранилище', async () => {
    const active = await repo.getActive();

    expect(active).toEqual([]);
  });
});
