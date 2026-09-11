import { describe, expect, test } from 'bun:test';
import { md } from '../../shared/markdown';
import {
  ask,
  btn,
  btnUrl,
  go,
  kb,
  note,
  notify,
  screen,
  warn,
} from './response-builders';

// ── Чистые билдеры ответов (ФР-1) ──
// Инвариант: возвращают те же структуры DialogResponse/KeyboardDescription,
// что и ручные литералы, — контракт «Диалог и Экран» не меняется.

describe('response-builders / screen', () => {
  test('текст без клавиатуры — экран без поля keyboard', () => {
    const text = md`Привет\\!`;
    expect(screen(text)).toEqual({ screen: { text } });
  });

  test('текст + клавиатура — экран с keyboard', () => {
    const text = md`Выбери:`;
    const keyboard = kb([[btn('Далее', 'next')]]);
    expect(screen(text, keyboard)).toEqual({
      screen: {
        text,
        keyboard: {
          rows: [[{ text: 'Далее', code: 'next' }]],
          isMultiple: false,
        },
      },
    });
  });
});

describe('response-builders / ask', () => {
  test('экран + awaitInput с контекстом', () => {
    const text = md`Как тебя зовут?`;
    const context = { step: 1, name: '' };
    expect(ask(text, context)).toEqual({
      screen: { text },
      awaitInput: { context },
    });
  });

  test('с клавиатурой — экран её включает', () => {
    const text = md`Готов?`;
    const keyboard = kb([[btn('✅ Да', 'yes')]]);
    const res = ask(text, { q: 1 }, keyboard);
    expect(res.screen?.keyboard).toEqual(keyboard);
    expect(res.awaitInput).toEqual({ context: { q: 1 } });
  });
});

describe('response-builders / notify', () => {
  test('уведомление без kind — дефолтный вид транспорта 🔔', () => {
    expect(notify(md`Отменено\\. Наберите /start`)).toEqual({
      notify: { text: md`Отменено\\. Наберите /start` },
    });
  });
});

describe('response-builders / warn и note', () => {
  test('warn — уведомление kind: warn', () => {
    expect(warn(md`Некорректное значение`)).toEqual({
      notify: { text: md`Некорректное значение`, kind: 'warn' },
    });
  });

  test('note — уведомление kind: info', () => {
    expect(note(md`Сохранено`)).toEqual({
      notify: { text: md`Сохранено`, kind: 'info' },
    });
  });
});

describe('response-builders / go', () => {
  test('делегирование по пути', () => {
    expect(go('app:main-menu')).toEqual({
      delegate: { path: 'app:main-menu' },
    });
  });
});

describe('response-builders / kb', () => {
  test('isMultiple: false по умолчанию', () => {
    expect(kb([[btn('A', 'a')]])).toEqual({
      rows: [[{ text: 'A', code: 'a' }]],
      isMultiple: false,
    });
  });

  test('opts.multiple: true — isMultiple: true', () => {
    expect(kb([], { multiple: true })).toEqual({ rows: [], isMultiple: true });
  });

  test('принимает btnUrl-кнопки (url-кнопки клавиатуры)', () => {
    expect(kb([[btnUrl('Сайт', 'https://example.com')]])).toEqual({
      rows: [[{ text: 'Сайт', code: '', url: 'https://example.com' }]],
      isMultiple: false,
    });
  });

  test('не мутирует переданные rows', () => {
    const rows = [[btn('A', 'a')]];
    kb(rows);
    expect(rows).toEqual([[{ text: 'A', code: 'a' }]]);
  });

  test('детерминированность: равные аргументы — равный результат', () => {
    expect(kb([[btn('A', 'a')]], { multiple: true })).toEqual(
      kb([[btn('A', 'a')]], { multiple: true }),
    );
  });
});

describe('response-builders / btn и btnUrl', () => {
  test('btn — callback-кнопка { text, code }', () => {
    expect(btn('Открыть', 'open:1')).toEqual({
      text: 'Открыть',
      code: 'open:1',
    });
  });

  test('btnUrl — url-кнопка с пустым code (транспорт рендерит по url)', () => {
    expect(btnUrl('Чат школы', 'https://t.me/school')).toEqual({
      text: 'Чат школы',
      code: '',
      url: 'https://t.me/school',
    });
  });
});
