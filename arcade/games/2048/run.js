import { startEngine } from '../../engine.js';
import { createDirectionAdapter, renderNumberGrid } from '../../render/grid.js';
import { createState, getView, update } from './game-2048.js';

startEngine({
  title: '2048',
  adapter: createDirectionAdapter(),
  render: renderNumberGrid,
  createState,
  update,
  getView,
});
