import { startEngine } from '../../engine.js';
import { cursorActionAdapter, renderGrid } from '../../render/grid.js';
import { createState, getView, update } from './minesweeper.js';

startEngine({
  title: 'Сапёр',
  adapter: cursorActionAdapter,
  render: renderGrid,
  createState,
  update,
  getView,
});
