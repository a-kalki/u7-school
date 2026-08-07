import { describe, expect, test } from 'bun:test';
import { renderTree, type TreeNode } from '../../src/shared/tree-renderer';

describe('renderTree', () => {
  test('пустой массив — пустая строка', () => {
    expect(renderTree([])).toBe('');
  });

  test('один узел без детей', () => {
    const nodes: TreeNode[] = [
      { title: 'Проект', emoji: '📁', meta: '2 урока, 3 шага' },
    ];
    expect(renderTree(nodes)).toBe('📁 *Проект* — 2 урока, 3 шага');
  });

  test('один узел без meta', () => {
    const nodes: TreeNode[] = [{ title: 'Проект', emoji: '📁' }];
    expect(renderTree(nodes)).toBe('📁 *Проект*');
  });

  test('узел с детьми', () => {
    const nodes: TreeNode[] = [
      {
        title: 'ToDo App',
        emoji: '📁',
        meta: '2 урока, 3 шага',
        children: [
          { title: 'HTML разметка', emoji: '📝', meta: '2 шага' },
          { title: 'CSS стили', emoji: '📝', meta: '1 шаг' },
        ],
      },
    ];
    expect(renderTree(nodes)).toBe(
      [
        '📁 *ToDo App* — 2 урока, 3 шага',
        '    📝 HTML разметка — 2 шага',
        '    📝 CSS стили — 1 шаг',
      ].join('\n'),
    );
  });

  test('несколько узлов с детьми', () => {
    const nodes: TreeNode[] = [
      {
        title: 'Проект A',
        emoji: '📁',
        meta: '1 урок, 1 шаг',
        children: [{ title: 'Урок 1', emoji: '📝', meta: '1 шаг' }],
      },
      {
        title: 'Проект B',
        emoji: '📁',
        meta: '2 урока, 3 шага',
        children: [
          { title: 'Урок 2', emoji: '📝', meta: '2 шага' },
          { title: 'Урок 3', emoji: '📝', meta: '1 шаг' },
        ],
      },
    ];
    expect(renderTree(nodes)).toBe(
      [
        '📁 *Проект A* — 1 урок, 1 шаг',
        '    📝 Урок 1 — 1 шаг',
        '📁 *Проект B* — 2 урока, 3 шага',
        '    📝 Урок 2 — 2 шага',
        '    📝 Урок 3 — 1 шаг',
      ].join('\n'),
    );
  });

  test('узел с пустым списком детей — дети не отображаются', () => {
    const nodes: TreeNode[] = [{ title: 'Проект', emoji: '📁', children: [] }];
    expect(renderTree(nodes)).toBe('📁 *Проект*');
  });

  test('спецсимволы в заголовке (экранирование — зона ответственности вызывающего)', () => {
    // renderTree не экранирует — это задача вызывающего кода
    const nodes: TreeNode[] = [
      { title: 'Asterisk\\*underscore\\_tilde\\~', emoji: '📁' },
    ];
    // Символы * и _ в заголовке будут обработаны Markdown как форматирование
    // renderTree НЕ экранирует — это pure rendering
    expect(renderTree(nodes)).toBe('📁 *Asterisk\\*underscore\\_tilde\\~*');
  });
});
