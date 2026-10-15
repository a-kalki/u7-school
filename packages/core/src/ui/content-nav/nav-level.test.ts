import { describe, expect, test } from 'bun:test';
import { formatNavAddress, type NavLevel, parseNavAddress } from './types';

describe('NavLevel & NavAddress (Ядро drill-down)', () => {
  test('структура NavLevel содержит breadcrumbs, title, subtitle, children, prev, next, back', () => {
    const level: NavLevel = {
      breadcrumbs: ['📂 Уроки', 'Введение в web'],
      subtitle: 'Проект состоит из 2 уроков',
      children: [
        {
          id: 'b8c0a876-1234-4567-8901-abcdef123456',
          index: 1,
          title: 'Как устроен web',
          emoji: '📝',
          meta: '(3/3)',
          status: 'completed',
          enterable: true,
          address: 'nav:lesson:b8c0a876-1234-4567-8901-abcdef123456',
          children: [
            {
              title: 'Шаг 1',
              status: 'completed',
            },
          ],
        },
      ],
      prev: { address: 'nav:project:prev-id', label: '◀️ Пред. проект' },
      next: { address: 'nav:project:next-id', label: 'След. проект ▶️' },
      back: { address: 'nav:root', label: '⬅️ Назад к модулю' },
    };

    expect(level.breadcrumbs).toEqual(['📂 Уроки', 'Введение в web']);
    expect(level.children?.length).toBe(1);
    expect(level.children?.[0]?.status).toBe('completed');
  });

  describe('formatNavAddress & parseNavAddress', () => {
    test('root адрес без id', () => {
      const addr = formatNavAddress('nav-tree', 'root');
      expect(addr).toBe('nav-tree:root');

      const parsed = parseNavAddress(addr);
      expect(parsed).toEqual({
        prefix: 'nav-tree',
        level: 'root',
      });
    });

    test('адрес с id сущности (UUID)', () => {
      const uuid = 'b8c0a876-1234-4567-8901-abcdef123456';
      const addr = formatNavAddress('nav-tree', 'lesson', uuid);
      expect(addr).toBe(`nav-tree:lesson:${uuid}`);

      const parsed = parseNavAddress(addr);
      expect(parsed).toEqual({
        prefix: 'nav-tree',
        level: 'lesson',
        id: uuid,
      });
    });

    test('парсинг произвольного префикса со двоеточиями', () => {
      const uuid = '11111111-2222-3333-4444-555555555555';
      const addr = formatNavAddress('stream:view-stream:program', 'step', uuid);
      expect(addr).toBe(`stream:view-stream:program:step:${uuid}`);

      const parsed = parseNavAddress(addr);
      expect(parsed).toEqual({
        prefix: 'stream:view-stream:program',
        level: 'step',
        id: uuid,
      });
    });

    test('невалидный адрес возвращает null', () => {
      expect(parseNavAddress('')).toBeNull();
      expect(parseNavAddress('singleword')).toBeNull();
    });
  });
});
