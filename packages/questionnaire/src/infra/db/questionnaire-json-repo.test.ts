import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Questionnaire } from '../../domain/questionnaire/entity';
import { QuestionnaireJsonRepo } from './questionnaire-json-repo';

describe('QuestionnaireJsonRepo', () => {
  let tmpDir: string;
  let repo: QuestionnaireJsonRepo;

  beforeEach(() => {
    tmpDir = mkdtempSync('/tmp/questionnaire-repo-test-');
    repo = new QuestionnaireJsonRepo(join(tmpDir, 'questionnaires.json'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  const makeQ = (overrides: Partial<Questionnaire> = {}): Questionnaire => ({
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
    createdAt: '2024-01-01T00:00',
    completedAt: null,
    ...overrides,
  });

  test('сохраняет и читает анкету', async () => {
    const q = makeQ();
    await repo.save(q);

    const found = await repo.getByUuid(q.uuid);
    expect(found).toBeDefined();
    expect(found?.uuid).toBe(q.uuid);
    expect(found?.respondentId).toBe('00000000-0000-0000-0000-000000000001');
  });

  test('возвращает undefined для несуществующей анкеты', async () => {
    const found = await repo.getByUuid('00000000-0000-0000-0000-000000000000');
    expect(found).toBeUndefined();
  });

  test('обновляет существующую анкету', async () => {
    const q = makeQ();
    await repo.save(q);

    const updated = {
      ...q,
      status: 'completed' as const,
      completedAt: '2024-01-02T00:00',
    };
    await repo.save(updated);

    const found = await repo.getByUuid(q.uuid);
    expect(found?.status).toBe('completed');
  });

  test('getByRespondentId фильтрует по respondentId', async () => {
    const q1 = makeQ({
      uuid: crypto.randomUUID(),
      respondentId: '11111111-1111-1111-1111-111111111111',
    });
    const q2 = makeQ({
      uuid: crypto.randomUUID(),
      respondentId: '22222222-2222-2222-2222-222222222222',
    });
    const q3 = makeQ({
      uuid: crypto.randomUUID(),
      respondentId: '11111111-1111-1111-1111-111111111111',
      status: 'completed',
    });

    await repo.save(q1);
    await repo.save(q2);
    await repo.save(q3);

    const all111 = await repo.getByRespondentId(
      '11111111-1111-1111-1111-111111111111',
    );
    expect(all111.length).toBe(2);
    expect(
      all111.every(
        (q) => q.respondentId === '11111111-1111-1111-1111-111111111111',
      ),
    ).toBe(true);

    const all222 = await repo.getByRespondentId(
      '22222222-2222-2222-2222-222222222222',
    );
    expect(all222.length).toBe(1);
  });

  test('валидирует схемы при чтении (невалидные игнорируются)', async () => {
    const q = makeQ();
    await repo.save(q);

    // Пишем мусор в файл
    const filePath = join(tmpDir, 'questionnaires.json');
    const existing = await Bun.file(filePath).json();
    existing.push({ invalid: 'data' });
    await Bun.write(filePath, JSON.stringify(existing));

    const found = await repo.getByUuid(q.uuid);
    expect(found).toBeDefined();
  });
});
