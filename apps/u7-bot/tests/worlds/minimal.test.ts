import { describe, expect, it } from 'bun:test';
import { assertWorldInvariants } from './invariants';
import { materializeWorld } from './materializer';
import { MINIMAL_WORLD } from './minimal';
import { getWorld } from './registry';

describe('Мир minimal', () => {
  it('зарегистрирован в реестре под именем minimal', () => {
    const world = getWorld('minimal');
    expect(world).toBeDefined();
    expect(world?.name).toBe('minimal');
  });

  it('содержит только одну dev-персону и пустые списки сущностей', () => {
    expect(MINIMAL_WORLD.name).toBe('minimal');
    expect(MINIMAL_WORLD.persons?.length).toBe(1);
    expect(MINIMAL_WORLD.persons?.[0]?.key).toBe('dev');
    expect(MINIMAL_WORLD.courses?.length ?? 0).toBe(0);
    expect(MINIMAL_WORLD.streams?.length ?? 0).toBe(0);
    expect(MINIMAL_WORLD.students?.length ?? 0).toBe(0);
    expect(MINIMAL_WORLD.campaigns?.length ?? 0).toBe(0);
  });

  it('успешно проходит все инварианты мира', () => {
    const state = MINIMAL_WORLD.buildState();
    expect(() => assertWorldInvariants(state)).not.toThrow();
    expect(state.users.length).toBe(1);
    expect(state.streams.length).toBe(0);
    expect(state.students.length).toBe(0);
    expect(state.courses.length).toBe(0);
  });

  it('успешно материализуется на диск', async () => {
    const res = await materializeWorld('minimal');
    expect(res.manifest.name).toBe('minimal');
    expect(res.dbDir).toBeDefined();
  });
});
