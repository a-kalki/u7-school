import type { MdText } from '../../shared/markdown';
import type { DialogResponse, KeyboardDescription } from './types';

// ── Чистые билдеры ответов (контракт «Диалог и Экран») ──
//
// Язык ответов стори: «показать экран», «спросить», «предупредить»,
// «заметить», «уйти» — вместо ручных литералов DialogResponse.
// Билдеры чистые: аргументы → структура, без доступа к сессии/транспорту.
// Возвращают те же структуры, что и литералы, — контракт не меняется.

/** Описание одной кнопки inline-клавиатуры. */
export interface KbButton {
  text: string;
  /** Callback-код; у url-кнопок — пустая строка (транспорт рендерит по url) */
  code: string;
  url?: string;
}

/** Callback-кнопка: нажатие шлёт `code` как callback_data. */
export function btn(text: string, code: string): KbButton {
  return { text, code };
}

/** Кнопка-ссылка: открывает url, callback-код пуст. */
export function btnUrl(text: string, url: string): KbButton {
  return { text, code: '', url };
}

/**
 * Клавиатура: `isMultiple: false` по умолчанию, `{ multiple: true }` —
 * многострочный выбор.
 */
export function kb(
  rows: KbButton[][],
  opts?: { multiple?: boolean },
): KeyboardDescription {
  return { rows, isMultiple: opts?.multiple ?? false };
}

/** Экран: текст + (опц.) клавиатура. */
export function screen(
  text: MdText,
  keyboard?: KeyboardDescription,
): DialogResponse {
  return keyboard ? { screen: { text, keyboard } } : { screen: { text } };
}

/** Спросить: экран + ожидание текстового ввода (`awaitInput` с контекстом). */
export function ask(
  text: MdText,
  context: unknown,
  keyboard?: KeyboardDescription,
): DialogResponse {
  return {
    ...(keyboard ? { screen: { text, keyboard } } : { screen: { text } }),
    awaitInput: { context },
  };
}

/** Предупреждение поверх диалога (kind: 'warn') — экран и ввод не трогает. */
export function warn(text: MdText): DialogResponse {
  return { notify: { text, kind: 'warn' } };
}

/** Инфо-заметка поверх диалога (kind: 'info') — экран и ввод не трогает. */
export function note(text: MdText): DialogResponse {
  return { notify: { text, kind: 'info' } };
}

/** Уйти: делегировать диалог по пути (полный маршрут, префиксованный контроллером). */
export function go(path: string): DialogResponse {
  return { delegate: { path } };
}
