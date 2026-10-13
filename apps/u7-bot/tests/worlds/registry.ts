import type { WorldDefinition } from './types';

const WORLDS = new Map<string, WorldDefinition>();

/**
 * Регистрирует декларацию мира по имени или дефиниции.
 */
export function registerWorld(
  nameOrDef: string | WorldDefinition,
  maybeDef?: WorldDefinition,
): void {
  let name: string;
  let def: WorldDefinition;
  if (typeof nameOrDef === 'string') {
    name = nameOrDef;
    def = maybeDef ? { ...maybeDef, name } : { name };
  } else {
    def = nameOrDef;
    name = def.name ?? 'default';
  }
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
export function listWorldNames(): string[] {
  return Array.from(WORLDS.keys());
}

/**
 * Возвращает список зарегистрированных миров с их определениями.
 */
export function listWorlds(): { name: string; definition: WorldDefinition }[] {
  return Array.from(WORLDS.entries()).map(([name, definition]) => ({
    name,
    definition,
  }));
}
