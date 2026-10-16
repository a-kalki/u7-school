import { type MdText, md, mdConcat, mdJoin } from '../../shared/markdown';
import { truncateByWords } from '../../shared/string-utility';
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

/** Максимальная длина строки промежуточного сегмента хлебных крошек */
export const MAX_PARENT_BREADCRUMB_LENGTH = 34;

/**
 * Форматирует хлебные крошки drill-down пути в MarkdownV2.
 * Например:
 * - `['📂 Уроки']` → `📂 *Уроки*`
 * - `['📂 Уроки', 'Web']` → `📂 *Уроки* › Web`
 * - при multiline: `['📖 Курсы', 'Курс: JS']` → `📖 *Курсы*\n› Курс: JS`
 */
export function formatBreadcrumbs(
  breadcrumbs: readonly string[],
  multiline = false,
): MdText {
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

  // Последующие сегменты пути
  for (let i = 1; i < breadcrumbs.length; i++) {
    const rawSegment = breadcrumbs[i];
    if (rawSegment) {
      const isLast = i === breadcrumbs.length - 1;
      const segment = isLast
        ? rawSegment
        : truncateByWords(rawSegment, MAX_PARENT_BREADCRUMB_LENGTH);

      if (multiline) {
        if (isLast) {
          parts.push(md`\n› *${segment}*`);
        } else {
          parts.push(md`\n› ${segment}`);
        }
      } else {
        parts.push(md` › ${segment}`);
      }
    }
  }

  return mdConcat(...parts);
}

/**
 * Форматирует строку подуровня дочернего элемента.
 */
function formatSubChild(sub: NavSubChild): MdText {
  const title = cleanChildButtonTitle(sub.title);
  const metaSuffix = sub.meta ? ` ${sub.meta}` : '';
  const statusIcon = sub.status ? ` ${STATUS_ICONS[sub.status]}` : '';

  return md`    ${title}${metaSuffix}${statusIcon}`;
}

/**
 * Форматирует строку дочернего элемента.
 */
function formatChild(child: NavChild): MdText[] {
  const lines: MdText[] = [];
  const statusIcon = child.status ? `${STATUS_ICONS[child.status]} ` : '';
  const meta = child.meta ? ` ${child.meta}` : '';
  const title = cleanChildButtonTitle(child.title);

  lines.push(md`${child.index}\\. ${statusIcon}${title}${meta}`);

  // Если переданы подуровни (дети детей) — выводим их под родителем
  if (child.children) {
    for (const sub of child.children) {
      lines.push(formatSubChild(sub));
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
  sections.push(
    formatBreadcrumbs(level.breadcrumbs, level.multilineBreadcrumbs),
  );

  // 2. Статус шапки (если есть явная подпись статуса, например карточка шага)
  if (level.statusLabel) {
    const icon = level.status ? `${STATUS_ICONS[level.status]} ` : '';
    sections.push(md`${icon}${level.statusLabel}`);
  }

  // 3. Тело контента (для карточки шага)
  if (level.body) {
    sections.push(md`${level.body}`);
  }

  // 4. Пояснение уровня (заголовок списка) и дочерние элементы
  const children = level.children ?? [];
  const hasChildren = children.length > 0;
  if (level.subtitle && hasChildren) {
    const childLines: MdText[] = [];
    for (const child of children) {
      childLines.push(...formatChild(child));
    }
    sections.push(
      mdConcat(md`*${level.subtitle}*\n`, mdJoin(childLines, '\n')),
    );
  } else {
    if (level.subtitle) {
      sections.push(md`*${level.subtitle}*`);
    }
    if (hasChildren) {
      const childLines: MdText[] = [];
      for (const child of children) {
        childLines.push(...formatChild(child));
      }
      sections.push(mdJoin(childLines, '\n'));
    }
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
const MAX_BUTTON_LABEL_LENGTH = 44;

/**
 * Очищает название дочернего элемента для отображения на кнопке (без эмодзи и префикса уровня).
 */
function cleanChildButtonTitle(title: string): string {
  // 1. Убираем ведущие эмодзи и пробелы
  let cleaned = title.replace(
    /^(?:\p{Extended_Pictographic}|\uFE0F|\u200D|\s)+/u,
    '',
  );
  // 2. Убираем служебный префикс уровня ("Этап:", "Проект:", "Урок:", "Модуль:", "Шаг:")
  cleaned = cleaned.replace(
    /^(?:Курс|Этап|Модуль|Проект|Урок|Шаг(?:\s*\d+)?):\s*/iu,
    '',
  );
  // 3. Убираем оставшиеся ведущие эмодзи, если шли после префикса
  cleaned = cleaned.replace(
    /^(?:\p{Extended_Pictographic}|\uFE0F|\u200D|\s)+/u,
    '',
  );
  return cleaned.trim();
}

/**
 * Формирует читабельный текст для кнопки дочернего элемента.
 */
function buildChildButtonText(child: NavChild): string {
  // На кнопке выводим только краткий прогресс (например "(1/2)"),
  // а развёрнутые счётчики ("(2 урока)", "(5 шагов)") остаются в тексте карточки
  const showMetaOnButton = child.meta && /^\(\d+\/\d+\)$/.test(child.meta);
  const meta = showMetaOnButton ? ` ${child.meta}` : '';
  const title = cleanChildButtonTitle(child.title);

  const full = `${child.index}. ${title}${meta}`;
  if (full.length > MAX_BUTTON_LABEL_LENGTH) {
    const available =
      MAX_BUTTON_LABEL_LENGTH - `${child.index}. ${meta}`.length;
    const truncatedTitle = truncateByWords(title, available);
    return `${child.index}. ${truncatedTitle}${meta}`;
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

  // 2.5. Дополнительные ряды кнопок (например wish actions: после навигации, перед кнопкой назад)
  if (level.extraRows && level.extraRows.length > 0) {
    for (const extraRow of level.extraRows) {
      rows.push([...extraRow]);
    }
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
