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
    const segment = breadcrumbs[i];
    if (segment) {
      const isLast = i === breadcrumbs.length - 1;
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
    let emojiPrefix = '';
    if (child.emoji && !child.title.startsWith(child.emoji)) {
      emojiPrefix = `${child.emoji} `;
    }
    lines.push(
      md`${child.index}\\. ${emojiPrefix}*${child.title}*${meta}${statusPart}`,
    );
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
      let emojiPrefix = '';
      if (child.emoji && !child.title.startsWith(child.emoji)) {
        emojiPrefix = `${child.emoji} `;
      }
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
  sections.push(
    formatBreadcrumbs(level.breadcrumbs, level.multilineBreadcrumbs),
  );

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
  const meta = child.meta ? ` ${child.meta}` : '';
  let title = cleanChildButtonTitle(child.title);

  const full = `${child.index}. ${title}${meta}`;
  if (full.length > MAX_BUTTON_LABEL_LENGTH) {
    const available =
      MAX_BUTTON_LABEL_LENGTH - `${child.index}. ${meta}...`.length;
    title = `${title.slice(0, Math.max(5, available))}...`;
    return `${child.index}. ${title}${meta}`;
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

  // 1.5. Дополнительные ряды кнопок (например wish actions)
  if (level.extraRows && level.extraRows.length > 0) {
    for (const extraRow of level.extraRows) {
      rows.push([...extraRow]);
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
