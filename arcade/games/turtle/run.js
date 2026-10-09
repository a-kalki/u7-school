/**
 * arcade/games/turtle/run.js — Точка входа для запуска «Черепашки»
 *
 * Связывает 3 слоя:
 * 1. engine.js (Слой 1 — TUI ядро)
 * 2. render/turtle.js (Слой 2 — рендер и ввод)
 * 3. games/turtle/turtle.js (Слой 3 — чистая логика)
 *
 * Запуск в терминале:
 *   bun games/turtle/run.js
 *   (или из корня: bun arcade/games/turtle/run.js)
 */

import { startEngine } from '../../engine.js';
import { inputAdapter, renderTurtle } from '../../render/turtle.js';
import { createState, getView, update } from './turtle.js';

startEngine({
  title: 'Черепашка на сетке',
  adapter: inputAdapter,
  render: renderTurtle,
  createState,
  update,
  getView,
});
