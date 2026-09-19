/**
 * Узел дерева для рендеринга в MarkdownV2.
 *
 * Используется в каталоге курсов, дереве уроков студента,
 * менторских просмотрах прогресса.
 */
export interface TreeNode {
  /** Заголовок узла (уже экранированный для MarkdownV2) */
  title: string;
  /** Эмодзи перед заголовком */
  emoji: string;
  /** Мета-информация о детях (например «2 урока, 3 шага») */
  meta?: string;
  /** Дочерние узлы (только один уровень вложенности) */
  children?: Omit<TreeNode, 'children'>[];
}

/**
 * Рендерит блоки дерева: один блок = корневой узел со всеми его детьми.
 *
 * Блок — единица пагинации (трек pagination): страница наполняется
 * ЦЕЛЫМИ блоками, узел с детьми не рвётся посередине. Строки блока —
 * готовый MarkdownV2 (title уже экранирован).
 */
export function renderTreeBlocks(nodes: TreeNode[]): string[] {
  return nodes.map((node) => {
    const meta = node.meta ? ` — ${node.meta}` : '';
    const lines = [`${node.emoji} *${node.title}*${meta}`];

    for (const child of node.children ?? []) {
      const childMeta = child.meta ? ` — ${child.meta}` : '';
      lines.push(`    ${child.emoji} ${child.title}${childMeta}`);
    }

    return lines.join('\n');
  });
}

/**
 * Рендерит дерево узлов в MarkdownV2.
 *
 * Каждый узел: `эмодзи *жирный заголовок* — мета`.
 * Дети отображаются с отступом 4 пробела: `эмодзи заголовок — мета`.
 *
 * Чистая функция, без зависимостей от доменов и внешних сервисов.
 */
export function renderTree(nodes: TreeNode[]): string {
  return renderTreeBlocks(nodes).join('\n');
}
