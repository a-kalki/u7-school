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
 * Рендерит дерево узлов в MarkdownV2.
 *
 * Каждый узел: `эмодзи *жирный заголовок* — мета`.
 * Дети отображаются с отступом 4 пробела: `эмодзи заголовок — мета`.
 *
 * Чистая функция, без зависимостей от доменов и внешних сервисов.
 */
export function renderTree(nodes: TreeNode[]): string {
  const lines: string[] = [];

  for (const node of nodes) {
    const meta = node.meta ? ` — ${node.meta}` : '';
    lines.push(`${node.emoji} *${node.title}*${meta}`);

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const childMeta = child.meta ? ` — ${child.meta}` : '';
        lines.push(`    ${child.emoji} ${child.title}${childMeta}`);
      }
    }
  }

  return lines.join('\n');
}
