import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Questionnaire } from '../../domain/questionnaire/entity';
import type { QuestionnaireState } from '../../domain/questionnaire/repo';
import { QuestionnaireJsonRepo } from './questionnaire-json-repo';

describe('QuestionnaireRepo.getIdle (брошенные анкеты)', () => {
  let tmpDir: string;
  let repo: QuestionnaireJsonRepo;

  beforeEach(() => {
    tmpDir = mkdtempSync('/tmp/questionnaire-idle-test-');
    repo = new QuestionnaireJsonRepo(join(tmpDir, 'questionnaires.json'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  const HOUR = 60 * 60 * 1000;
  // Формат дат анкеты — isoNow(): 'YYYY-MM-DDTHH:mm' (UTC без секунд и Z)
  const isoAgo = (ms: number) =>
    new Date(Date.now() - ms).toISOString().slice(0, 16);

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
    createdAt: isoAgo(10 * HOUR),
    updatedAt: isoAgo(10 * HOUR),
    completedAt: null,
    ...overrides,
  });

  /** Минимально валидная likert-анкета (схема требует likertMapping в вопросах) */
  const makeLikert = (): QuestionnaireState =>
    ({
      kind: 'likert',
      uuid: crypto.randomUUID(),
      respondentId: '00000000-0000-0000-0000-000000000001',
      status: 'in_progress',
      currentQuestionCode: 'lq1',
      draftAnswers: {},
      answers: [],
      questionPool: {
        questions: [
          {
            question: 'Q1',
            questionCode: 'lq1',
            likertMapping: { category: 'C', subcategory: 'S', weight: 1 },
          },
        ],
      },
      ownerInfo: {},
      createdAt: isoAgo(10 * HOUR),
      updatedAt: isoAgo(9 * HOUR),
      completedAt: null,
    }) as never;

  test('возвращает незавершённые анкеты с простоем ≥ порога: и in_progress, и invited', async () => {
    await repo.save(
      makeQ({ status: 'in_progress', updatedAt: isoAgo(9 * HOUR) }),
    );
    await repo.save(makeQ({ status: 'invited', updatedAt: isoAgo(7 * HOUR) }));

    const idle = await repo.getIdle({ idleMs: 6 * HOUR });

    expect(idle).toHaveLength(2);
  });

  test('не возвращает completed и abandoned', async () => {
    await repo.save(
      makeQ({ status: 'completed', updatedAt: isoAgo(9 * HOUR) }),
    );
    await repo.save(
      makeQ({ status: 'abandoned', updatedAt: isoAgo(9 * HOUR) }),
    );

    const idle = await repo.getIdle({ idleMs: 6 * HOUR });

    expect(idle).toEqual([]);
  });

  test('не возвращает анкеты с простоем меньше порога', async () => {
    await repo.save(makeQ({ updatedAt: isoAgo(1 * HOUR) }));

    const idle = await repo.getIdle({ idleMs: 6 * HOUR });

    expect(idle).toEqual([]);
  });

  test('простой считается от updatedAt ?? createdAt', async () => {
    // updatedAt свежий, несмотря на старый createdAt — не «застояла»
    await repo.save(
      makeQ({ createdAt: isoAgo(10 * HOUR), updatedAt: isoAgo(1 * HOUR) }),
    );
    // updatedAt отсутствует — точка отсчёта createdAt
    const noUpdate = makeQ({
      createdAt: isoAgo(9 * HOUR),
    });
    delete noUpdate.updatedAt;
    await repo.save(noUpdate);

    const idle = await repo.getIdle({ idleMs: 6 * HOUR });

    expect(idle).toHaveLength(1);
    expect(idle[0]?.updatedAt).toBeUndefined();
  });

  test('kinds фильтрует тип анкеты', async () => {
    await repo.save(makeQ({ updatedAt: isoAgo(9 * HOUR) }));
    await repo.save(makeLikert());

    const idle = await repo.getIdle({ idleMs: 6 * HOUR, kinds: ['standard'] });

    expect(idle).toHaveLength(1);
    expect(idle[0]?.kind).toBe('standard');
  });

  test('без kinds возвращает все типы', async () => {
    await repo.save(makeQ({ updatedAt: isoAgo(9 * HOUR) }));
    await repo.save(makeLikert());

    const idle = await repo.getIdle({ idleMs: 6 * HOUR });

    expect(idle).toHaveLength(2);
  });

  test('statuses переопределяет дефолт «активные»', async () => {
    await repo.save(
      makeQ({ status: 'in_progress', updatedAt: isoAgo(9 * HOUR) }),
    );
    await repo.save(makeQ({ status: 'invited', updatedAt: isoAgo(9 * HOUR) }));

    const idle = await repo.getIdle({
      idleMs: 6 * HOUR,
      statuses: ['in_progress'],
    });

    expect(idle).toHaveLength(1);
    expect(idle[0]?.status).toBe('in_progress');
  });

  test('пустое хранилище — пустой массив', async () => {
    const idle = await repo.getIdle({ idleMs: 6 * HOUR });

    expect(idle).toEqual([]);
  });
});
