import { type MdText, md, mdConcat, mdJoin } from '../../shared/markdown';
import { btn, type KbButton, kb } from '../bot/response-builders';
import type { KeyboardDescription } from '../bot/types';
import type {
  NavChild,
  NavLevel,
  NavNodeStatus,
  NavSubChild,
  NavTarget,
} from './types';

/** Иконки статуса узлов навигации */
export const STATUS_ICONS: Record<NavNodeStatus, string> = {
  completed: '✅',
  in_progress: '▶️',
  locked: '🔒',
};

/**
 * Форматирует хлебные крошки drill-down пути в MarkdownV2.
 * Например:
 * - `['📂 Уроки']` → `📂 *Уроки*`
 * - `['📂 Уроки', 'Web']` → `📂 *Уроки* › Web`
 */
export function formatBreadcrumbs(breadcrumbs: readonly string[]): MdText {
  if (breadcrumbs.length === 0) return md``;

  const parts: MdText[] = [];

  // Первый элемент (корень): выделяем название жирным
  const root = breadcrumbs[0];
  if (root) {
    const match = root.match(/^(\p{Extended_Pictographic}+)\s+(.*)$/u);
    if (match?.[1] && match[2]) {
      parts.push(md`${match[1]} *${match[2]}*`);
    } else {
      parts.push(md`*${root}*`);
    }
  }

  // Последующие сегменты пути через разделитель ` › `
  for (let i = 1; i < breadcrumbs.length; i++) {
    const segment = breadcrumbs[i];
    if (segment) {
      parts.push(md` › ${segment}`);
    }
  }

  return mdConcat(...parts);
}

/**
 * Форматирует строку подуровня дочернего элемента.
 */
function formatSubChild(sub: NavSubChild): MdText {
  const emojiPrefix = sub.emoji ? `${sub.emoji} ` : '';
  const metaSuffix = sub.meta ? ` ${sub.meta}` : '';
  const statusIcon = sub.status ? ` ${STATUS_ICONS[sub.status]}` : '';

  return md`    ${emojiPrefix}${sub.title}${metaSuffix}${statusIcon}`;
}

/**
 * Форматирует строку дочернего элемента.
 */
function formatChild(child: NavChild, isNestedList: boolean): MdText[] {
  const lines: MdText[] = [];
  const statusIcon = child.status ? STATUS_ICONS[child.status] : undefined;
  const meta = child.meta ? ` ${child.meta}` : '';

  if (isNestedList) {
    // В списке с подуровнями (проекты модуля или уроки проекта) родитель жирным
    const statusPart = statusIcon ? ` ${statusIcon}` : '';
    lines.push(md`${child.index}\\. *${child.title}*${meta}${statusPart}`);
    if (child.children) {
      for (const sub of child.children) {
        lines.push(formatSubChild(sub));
      }
    }
  } else {
    // Одноуровневый список (шаги урока): если есть статус, он ставится перед заголовком
    if (statusIcon) {
      lines.push(md`${child.index}\\. ${statusIcon} ${child.title}${meta}`);
    } else {
      const emojiPrefix = child.emoji ? `${child.emoji} ` : '';
      lines.push(md`${child.index}\\. ${emojiPrefix}${child.title}${meta}`);
    }
  }

  return lines;
}

/**
 * Форматирует NavLevel в MarkdownV2 текст.
 */
export function formatNavLevelText(level: NavLevel): MdText {
  const sections: MdText[] = [];

  // 1. Шапка: хлебные крошки
  sections.push(formatBreadcrumbs(level.breadcrumbs));

  // 2. Статус шапки (если есть явная подпись статуса, например карточка шага)
  if (level.statusLabel) {
    const icon = level.status ? `${STATUS_ICONS[level.status]} ` : '';
    sections.push(md`${icon}${level.statusLabel}`);
  }

  // 3. Пояснение уровня
  if (level.subtitle) {
    sections.push(md`${level.subtitle}`);
  }

  // 4. Тело контента (для карточки шага)
  if (level.body) {
    sections.push(md`${level.body}`);
  }

  // 5. Дочерние элементы
  if (level.children && level.children.length > 0) {
    // Определяем, является ли список двухуровневым (хотя бы у одного ребёнка есть подуровень)
    const isNestedList = level.children.some(
      (c) => c.children !== undefined && c.children.length > 0,
    );

    const childLines: MdText[] = [];
    for (const child of level.children) {
      childLines.push(...formatChild(child, isNestedList));
    }
    sections.push(mdJoin(childLines, '\n'));
  }

  return mdJoin(sections, '\n\n');
}

/**
 * Извлекает label и address из NavTarget | string.
 */
function resolveTarget(
  target: NavTarget | string,
  defaultLabel: string,
): { label: string; address: string } {
  if (typeof target === 'string') {
    return { label: defaultLabel, address: target };
  }
  return {
    label: target.label ?? defaultLabel,
    address: target.address,
  };
}

/** Максимальная длина текста на inline-кнопке для предотвращения обрезки в Telegram. */
const MAX_BUTTON_LABEL_LENGTH = 48;

/**
 * Формирует читабельный текст для кнопки дочернего элемента.
 */
function buildChildButtonText(child: NavChild): string {
  // На кнопках проектов (📁) и уроков (📝) используется их emoji
  // На кнопках шагов (📄 или без emoji) — статусная иконка ✅/▶️ или 📄 (у ментора)
  let prefix = '';
  if (child.emoji && child.emoji !== '📄') {
    prefix = `${child.emoji} `;
  } else if (child.status) {
    prefix = `${STATUS_ICONS[child.status]} `;
  } else if (child.emoji) {
    prefix = `${child.emoji} `;
  }

  const meta = child.meta ? ` ${child.meta}` : '';

  let title = child.title;
  const full = `${child.index}. ${prefix}${title}${meta}`;
  if (full.length > MAX_BUTTON_LABEL_LENGTH) {
    const available =
      MAX_BUTTON_LABEL_LENGTH - `${child.index}. ${prefix}${meta}...`.length;
    title = `${title.slice(0, Math.max(5, available))}...`;
    return `${child.index}. ${prefix}${title}${meta}`;
  }

  return full;
}

/**
 * Формирует клавиатуру для NavLevel.
 */
export function buildNavLevelKeyboard(level: NavLevel): KeyboardDescription {
  const rows: KbButton[][] = [];

  // 1. Дочерние кнопки (только доступные: enterable && address)
  if (level.children) {
    for (const child of level.children) {
      if (child.enterable && child.address) {
        rows.push([btn(buildChildButtonText(child), child.address)]);
      }
    }
  }

  // 2. Навигационный ряд соседей: ◀️ / ▶️ в одном ряду
  const navRow: KbButton[] = [];
  if (level.prev) {
    const { label, address } = resolveTarget(level.prev, '◀️ Пред.');
    navRow.push(btn(label, address));
  }
  if (level.next) {
    const { label, address } = resolveTarget(level.next, 'След. ▶️');
    navRow.push(btn(label, address));
  }
  if (navRow.length > 0) {
    rows.push(navRow);
  }

  // 3. Кнопка возврата: ⬅️ Назад в самом низу
  const back = resolveTarget(level.back, '⬅️ Назад');
  rows.push([btn(back.label, back.address)]);

  return kb(rows);
}

/**
 * Презентует NavLevel: чистая функция преобразования в MarkdownV2 текст и клавиатуру.
 */
export function presentNavLevel(level: NavLevel): {
  text: MdText;
  keyboard: KeyboardDescription;
} {
  return {
    text: formatNavLevelText(level),
    keyboard: buildNavLevelKeyboard(level),
  };
}
