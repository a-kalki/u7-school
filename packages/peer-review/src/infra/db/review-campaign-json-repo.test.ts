import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type {
  CampaignParticipant,
  ReviewCampaign,
} from '#domain/review-campaign/entity';
import { ReviewCampaignJsonRepo } from './review-campaign-json-repo';

/** Даты-границы, независимые от момента запуска тестов. */
const PAST = '2020-01-01T00:00';
const FUTURE = '2099-01-01T00:00';

const UUIDS = [
  '11111111-1111-4111-8111-1111111111a1',
  '22222222-2222-4222-8222-2222222222a2',
  '33333333-3333-4333-8333-3333333333a3',
  '44444444-4444-4444-8444-4444444444a4',
  '55555555-5555-4555-8555-5555555555a5',
  '66666666-6666-4666-8666-6666666666b1',
] as const;

/** Валидная кампания stream_ended с минимальным составом участников. */
function makeCampaign(input: {
  uuid: string;
  scopeId: string;
  subjectId: string;
  expiresAt?: string;
  mentorId?: string;
}): ReviewCampaign {
  const participants: CampaignParticipant[] = [
    {
      userId: input.subjectId,
      role: 'student',
      outcome: 'completed',
    },
  ];
  if (input.mentorId) {
    participants.push({ userId: input.mentorId, role: 'mentor' });
  }

  return {
    uuid: input.uuid,
    context: 'stream_ended',
    scopeId: input.scopeId,
    subjectId: input.subjectId,
    createdAt: '2026-06-01T00:00',
    expiresAt: input.expiresAt ?? FUTURE,
    participants,
    payload: {},
  };
}

describe('ReviewCampaignJsonRepo', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'u7-review-campaigns-'));
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test('save + findById: сохранение и чтение по uuid', async () => {
    const repo = new ReviewCampaignJsonRepo(join(dir, 'roundtrip.json'));
    const campaign = makeCampaign({
      uuid: UUIDS[0],
      scopeId: UUIDS[4],
      subjectId: UUIDS[1],
      mentorId: UUIDS[3],
    });

    await repo.save(campaign);

    expect(await repo.findById(UUIDS[0])).toEqual(campaign);
    expect(await repo.findById(UUIDS[5])).toBeUndefined();
  });

  test('save: повторный save той же кампании обновляет, а не дублирует', async () => {
    const repo = new ReviewCampaignJsonRepo(join(dir, 'update.json'));
    const campaign = makeCampaign({
      uuid: UUIDS[0],
      scopeId: UUIDS[4],
      subjectId: UUIDS[1],
    });

    await repo.save(campaign);
    const updated = {
      ...campaign,
      expiresAt: FUTURE,
      updatedAt: '2026-06-02T10:00',
    };
    await repo.save(updated);

    const all = await repo.findBySubject(UUIDS[4], UUIDS[1]);
    expect(all).toEqual(updated);
  });

  test('save: дубль ключа (scopeId, subjectId) с другим uuid — ошибка', async () => {
    const repo = new ReviewCampaignJsonRepo(join(dir, 'unique.json'));
    await repo.save(
      makeCampaign({
        uuid: UUIDS[0],
        scopeId: UUIDS[4],
        subjectId: UUIDS[1],
      }),
    );

    const duplicate = makeCampaign({
      uuid: UUIDS[2],
      scopeId: UUIDS[4],
      subjectId: UUIDS[1],
    });

    expect(repo.save(duplicate)).rejects.toThrow();
  });

  test('findBySubject: кампания окна по ключу (scopeId, subjectId)', async () => {
    const repo = new ReviewCampaignJsonRepo(join(dir, 'by-subject.json'));
    const campaign = makeCampaign({
      uuid: UUIDS[0],
      scopeId: UUIDS[4],
      subjectId: UUIDS[1],
    });
    await repo.save(campaign);

    expect(await repo.findBySubject(UUIDS[4], UUIDS[1])).toEqual(campaign);
    expect(await repo.findBySubject(UUIDS[4], UUIDS[2])).toBeUndefined();
    expect(await repo.findBySubject(UUIDS[5], UUIDS[1])).toBeUndefined();
  });

  test('findActiveBySubject: только неистёкшие кампании, где пользователь — субъект', async () => {
    const repo = new ReviewCampaignJsonRepo(join(dir, 'active-subject.json'));
    // Активное окно субъекта — попадает в выборку
    await repo.save(
      makeCampaign({
        uuid: UUIDS[0],
        scopeId: UUIDS[4],
        subjectId: UUIDS[1],
      }),
    );
    // Истёкшее окно того же субъекта — не попадает
    await repo.save(
      makeCampaign({
        uuid: UUIDS[2],
        scopeId: UUIDS[5],
        subjectId: UUIDS[1],
        expiresAt: PAST,
      }),
    );
    // Активное окно, где пользователь только ментор — не попадает
    await repo.save(
      makeCampaign({
        uuid: UUIDS[3],
        scopeId: UUIDS[4],
        subjectId: UUIDS[2],
        mentorId: UUIDS[1],
      }),
    );

    const active = await repo.findActiveBySubject(UUIDS[1]);
    expect(active.map((c) => c.uuid)).toEqual([UUIDS[0]]);
  });

  test('findActiveByMentor: только неистёкшие кампании, где пользователь — ментор', async () => {
    const repo = new ReviewCampaignJsonRepo(join(dir, 'active-mentor.json'));
    // Активное окно с менторством — попадает в выборку
    await repo.save(
      makeCampaign({
        uuid: UUIDS[0],
        scopeId: UUIDS[4],
        subjectId: UUIDS[1],
        mentorId: UUIDS[3],
      }),
    );
    // Истёкшее окно с тем же менторством — не попадает
    await repo.save(
      makeCampaign({
        uuid: UUIDS[2],
        scopeId: UUIDS[5],
        subjectId: UUIDS[2],
        mentorId: UUIDS[3],
        expiresAt: PAST,
      }),
    );
    // Активное окно, где пользователь только субъект — не попадает
    await repo.save(
      makeCampaign({
        uuid: UUIDS[3],
        scopeId: UUIDS[4],
        subjectId: UUIDS[3],
      }),
    );

    const active = await repo.findActiveByMentor(UUIDS[3]);
    expect(active.map((c) => c.uuid)).toEqual([UUIDS[0]]);
  });
});
