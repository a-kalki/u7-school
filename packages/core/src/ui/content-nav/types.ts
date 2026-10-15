import type { KbButton } from '../bot/response-builders';

/**
 * Статус узла навигации в UI.
 * - 'completed' (✅) — завершён/пройден
 * - 'in_progress' (▶️) — в процессе/текущий
 * - 'locked' (🔒) — закрыт/будущий
 */
export type NavNodeStatus = 'completed' | 'in_progress' | 'locked';

/**
 * Уровень иерархии drill-down.
 */
export type NavLevelKind = 'root' | 'project' | 'lesson' | 'step' | string;

/**
 * Подуровень дочернего узла (дети детей, например уроки проекта при просмотре модуля).
 * Отображаются обычным списком с отступом под родителем для обзора состава следующего уровня.
 */
export interface NavSubChild {
  readonly id?: string;
  readonly index?: number;
  readonly title: string;
  readonly emoji?: string;
  readonly meta?: string;
  readonly status?: NavNodeStatus;
}

/**
 * Дочерний элемент текущего уровня.
 * Первый уровень списка — нумерованный, жирным; имеет кнопку перехода (если enterable).
 */
export interface NavChild {
  readonly id: string;
  readonly index: number;
  readonly title: string;
  readonly emoji?: string;
  readonly meta?: string;
  readonly status?: NavNodeStatus;
  /** Доступен ли узел для клика/входа. Если false — только строка в тексте со статусом, кнопки нет. */
  readonly enterable: boolean;
  /** Адрес (callback data) перехода внутрь узла (для кнопки) */
  readonly address?: string;
  /** Подуровень (дети детей для отображения в тексте карточки) */
  readonly children?: readonly NavSubChild[];
}

/**
 * Цель навигации (сосед или возврат).
 */
export interface NavTarget {
  readonly address: string;
  /** Кастомный текст кнопки (например «Пред. проект», «Назад к модулю»). Если не задан — дефолтный. */
  readonly label?: string;
}

/**
 * Модель карточки уровня drill-down навигации.
 * Полностью абстрагирована от домена и контекста (студент, ментор, курсы).
 */
export interface NavLevel {
  /**
   * Цепочка хлебных крошек drill-down от корня до текущего узла.
   * Например: `['📂 Уроки']` или `['📖 Программа модуля', 'Введение в web', 'Как устроен web']`.
   * Выводится в шапке карточки через разделитель ` › ` (или построчно с `› ` при `multilineBreadcrumbs: true`).
   */
  readonly breadcrumbs: readonly string[];

  /**
   * Выводить ли цепочку хлебных крошек построчно для глубоких иерархий (например, каталога курсов).
   * По умолчанию false (в одну строку через ` › `).
   */
  readonly multilineBreadcrumbs?: boolean;

  /** Название текущего уровня / узла (опционально, если нужно вывести отдельно от крошек) */
  readonly title?: string;

  /** Пояснение уровня (например: «Модуль состоит из 2 проектов», «Проект состоит из 3 уроков») */
  readonly subtitle?: string;

  /** Тело контента (для карточки шага — текст задания, теория или код) */
  readonly body?: string;

  /** Статус текущего узла (например для карточки шага: 'in_progress' или 'completed') */
  readonly status?: NavNodeStatus;

  /** Текстовая подпись статуса (например «В процессе», «Пройден») */
  readonly statusLabel?: string;

  /** Дочерние элементы (проекты, уроки, шаги) */
  readonly children?: readonly NavChild[];

  /** Дополнительные ряды кнопок (например, кнопки действий wish), размещаемые перед навигацией */
  readonly extraRows?: readonly (readonly KbButton[])[];

  /** Адрес предыдущего соседа в пределах родителя */
  readonly prev?: NavTarget | string;

  /** Адрес следующего соседа в пределах родителя */
  readonly next?: NavTarget | string;

  /** Адрес возврата на уровень выше (или выход из навигации) */
  readonly back: NavTarget | string;
}

/**
 * Разобранный адрес узла навигации.
 */
export interface ParsedNavAddress {
  readonly prefix: string;
  readonly level: NavLevelKind;
  readonly id?: string;
}

/**
 * Форматирует callback_data адрес для узла навигации со стабильным UUID.
 *
 * @param prefix префикс контроллера/стори (например 'nav-tree' или 'stream:program')
 * @param level уровень ('root', 'project', 'lesson', 'step')
 * @param id стабильный id сущности (UUID проекта, урока, шага). Для 'root' опускается.
 */
export function formatNavAddress(
  prefix: string,
  level: NavLevelKind,
  id?: string,
): string {
  if (level === 'root' || !id) {
    return `${prefix}:${level}`;
  }
  return `${prefix}:${level}:${id}`;
}

/**
 * Разбирает callback_data адрес навигации.
 * Возвращает { prefix, level, id } или null, если адрес не соответствует формату.
 */
export function parseNavAddress(address: string): ParsedNavAddress | null {
  if (!address || typeof address !== 'string') return null;

  const parts = address.split(':');
  if (parts.length < 2) return null;

  const lastPart = parts[parts.length - 1];
  const prevPart = parts[parts.length - 2];

  if (lastPart === 'root') {
    const prefix = parts.slice(0, -1).join(':');
    if (!prefix) return null;
    return { prefix, level: 'root' };
  }

  // Проверяем паттерн <prefix>:<level>:<id>
  if (parts.length >= 3 && prevPart && lastPart) {
    const prefix = parts.slice(0, -2).join(':');
    if (!prefix) return null;
    return {
      prefix,
      level: prevPart,
      id: lastPart,
    };
  }

  // <level>:<id> (когда транспорт стори уже отрезал префикс стори)
  if (
    parts.length === 2 &&
    parts[0] &&
    ['project', 'lesson', 'step'].includes(parts[0])
  ) {
    return {
      prefix: '',
      level: parts[0],
      id: parts[1],
    };
  }

  // <prefix>:<level>
  const prefix = parts[0];
  const level = parts[1];
  if (!prefix || !level) return null;

  return {
    prefix,
    level,
  };
}
