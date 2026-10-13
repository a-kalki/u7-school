import type { WorldDefinition } from './types';

const WORLDS = new Map<string, WorldDefinition>();
let defaultsLoaded = false;

function ensureDefaults(): void {
  if (defaultsLoaded) return;
  defaultsLoaded = true;

  // Ленивый импорт встроенных миров для предотвращения циклических зависимостей
  try {
    const { CORE_EDUCATION_WORLD } = require('./core-education');
    if (!WORLDS.has('core-education')) {
      WORLDS.set('core-education', CORE_EDUCATION_WORLD);
    }
  } catch {
    // В процессе инициализации
  }

  try {
    const { MINIMAL_WORLD } = require('./minimal');
    if (!WORLDS.has('minimal')) {
      WORLDS.set('minimal', MINIMAL_WORLD);
    }
  } catch {
    // В процессе инициализации
  }
}

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
  ensureDefaults();
  return WORLDS.get(name);
}

/**
 * Возвращает список имён зарегистрированных миров.
 */
export function listWorldNames(): string[] {
  ensureDefaults();
  return Array.from(WORLDS.keys());
}

/**
 * Возвращает список зарегистрированных миров с их определениями.
 */
export function listWorlds(): { name: string; definition: WorldDefinition }[] {
  ensureDefaults();
  return Array.from(WORLDS.entries()).map(([name, definition]) => ({
    name,
    definition,
  }));
}
