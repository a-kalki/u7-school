import { startEngine } from '../../engine.js';
import { createDirectionAdapter, renderGrid } from '../../render/grid.js';
import { createState, getView, update } from './sokoban.js';

startEngine({
  title: 'Сокобан',
  adapter: createDirectionAdapter(),
  render: renderGrid,
  createState,
  update,
  getView,
});
