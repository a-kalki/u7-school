import { buildWorldState } from './builder';
import { checkWorldInvariants, type InvariantViolation } from './invariants';
import type { WorldDefinition } from './types';

export interface CheckWorldOptions {
  logger?: (message: string) => void;
}

export interface CheckWorldResult {
  valid: boolean;
  violations: InvariantViolation[];
}

/**
 * Валидирует мир: собирает состояние и проверяет все инварианты.
 * Логирует подробный отчёт об обнаруженных нарушениях.
 */
export function checkWorld(
  def: WorldDefinition,
  options?: CheckWorldOptions,
): CheckWorldResult {
  const log = options?.logger ?? console.log;
  const worldName = def.name ?? 'без имени';

  const violations: InvariantViolation[] = [];

  try {
    const state = buildWorldState(def, { skipAssert: true });
    const foundViolations = checkWorldInvariants(state);
    violations.push(...foundViolations);
  } catch (err) {
    violations.push({
      code: 'BUILD_ERROR',
      message: err instanceof Error ? err.message : String(err),
      entity: 'World',
      id: worldName,
    });
  }

  if (violations.length === 0) {
    log(`✅ Мир "${worldName}" валиден. Все инварианты соблюдены.`);
    return { valid: true, violations: [] };
  }

  log(
    `❌ Мир "${worldName}" содержит нарушения инвариантов (${violations.length}):`,
  );
  for (const v of violations) {
    log(`  - [${v.code}] ${v.entity} (${v.id}): ${v.message}`);
  }

  return { valid: false, violations };
}
