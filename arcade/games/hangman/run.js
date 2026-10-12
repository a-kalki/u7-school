/**
 * arcade/games/hangman/run.js — Точка входа для запуска «Виселицы»
 *
 * Связывает 3 слоя:
 * 1. engine.js (Слой 1 — TUI ядро)
 * 2. tui/hangman.js (Слой 2 — TUI адаптеры: рендер и ввод)
 * 3. games/hangman/hangman.js (Слой 3 — чистая логика)
 *
 * Запуск в терминале:
 *   bun games/hangman/run.js
 *   (или из корня репозитория: bun arcade/games/hangman/run.js)
 */

import { startEngine } from '../../engine.js';
import { inputAdapter, renderHangman } from '../../tui/hangman.js';
import { createState, getView, update } from './hangman.js';

startEngine({
  title: 'Виселица: Термины курса',
  adapter: inputAdapter,
  render: renderHangman,
  createState,
  update,
  getView,
});
