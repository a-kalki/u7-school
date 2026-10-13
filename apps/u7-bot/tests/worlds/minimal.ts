import { Role } from '@u7-scl/user/domain';
import { buildWorldState } from './builder';
import { registerWorld } from './registry';
import type { RegisteredWorld, WorldDefinition } from './types';

const definition: WorldDefinition = {
  name: 'minimal',
  description: 'Минимальный мир: только dev-персона для быстрых дымовых тестов',
  anchorDate: new Date('2026-10-01T12:00:00.000Z'),
  persons: [
    {
      key: 'dev',
      name: 'Разработчик Dev',
      telegramId: 999999999,
      roles: [Role.ADMIN, Role.MENTOR],
      registeredAt: '2026-09-01T00:00:00.000Z',
    },
  ],
  courses: [],
  streams: [],
  students: [],
  campaigns: [],
  reviews: [],
  wishes: [],
  questionnaires: [],
};

export const MINIMAL_WORLD: RegisteredWorld = {
  ...definition,
  name: 'minimal',
  buildState() {
    return buildWorldState(definition);
  },
};

registerWorld(MINIMAL_WORLD);
