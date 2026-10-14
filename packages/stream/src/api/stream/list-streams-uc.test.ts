import { describe, expect, mock, test } from 'bun:test';
import * as v from 'valibot';
import type { StreamApiModuleResolver } from '#domain/module';
import { ListStreamsCmdSchema } from '#domain/stream/commands/list-streams-cmd';
import { StreamStatus } from '#domain/status';
import type { Stream } from '#domain/stream/entity';
import { ListStreamsUc } from './list-streams-uc';

describe('ListStreamsCmdSchema', () => {
  test('принимает фильтр со schoolId', () => {
    const input = {
      schoolId: 'a0000000-0000-4000-8000-000000000001',
      status: StreamStatus.ACTIVE,
    };
    const result = v.safeParse(ListStreamsCmdSchema, input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output.schoolId).toBe('a0000000-0000-4000-8000-000000000001');
    }
  });

  test('отклоняет невалидный UUID для schoolId', () => {
    const input = {
      schoolId: 'invalid-school-id',
    };
    const result = v.safeParse(ListStreamsCmdSchema, input);
    expect(result.success).toBe(false);
  });
});

describe('ListStreamsUc', () => {
  test('делегирует фильтрацию по schoolId в репозиторий', async () => {
    let capturedFilter: any = null;
    const mockRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getAll: mock((filter?: any) => {
        capturedFilter = filter;
        return Promise.resolve([
          {
            uuid: '550e8400-e29b-41d4-a716-446655440001',
            schoolId: 'a0000000-0000-4000-8000-000000000001',
            title: 'Поток 1',
            description: 'Описание',
            mentorId: '660e8400-e29b-41d4-a716-446655440002',
            moduleId: '770e8400-e29b-41d4-a716-446655440003',
            startDate: '2026-06-01T12:00',
            status: StreamStatus.ENROLLMENT,
            contentSnapshot: [],
            createdAt: '2026-06-01T10:00',
          } as Stream,
        ]);
      }),
    };

    const uc = new ListStreamsUc();
    uc.init({
      streamRepo: mockRepo,
    } as unknown as StreamApiModuleResolver);

    const streams = await uc.execute({
      schoolId: 'a0000000-0000-4000-8000-000000000001',
    });

    expect(capturedFilter).toEqual({
      schoolId: 'a0000000-0000-4000-8000-000000000001',
    });
    expect(streams.length).toBe(1);
    expect(streams[0]?.schoolId).toBe('a0000000-0000-4000-8000-000000000001');
  });
});
