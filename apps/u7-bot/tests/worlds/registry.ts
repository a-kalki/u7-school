import type { WorldDefinition } from './types';

const WORLDS = new Map<string, WorldDefinition>();

/**
 * Регистрирует декларацию мира по имени.
 */
export function registerWorld(def: WorldDefinition): void {
  const name = def.name ?? 'default';
  WORLDS.set(name, def);
}

/**
 * Возвращает зарегистрированный мир по имени.
 */
export function getWorld(name: string): WorldDefinition | undefined {
  return WORLDS.get(name);
}

/**
 * Возвращает список имён зарегистрированных миров.
 */
export function listWorlds(): string[] {
  return Array.from(WORLDS.keys());
}
