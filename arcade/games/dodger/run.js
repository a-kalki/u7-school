import { startEngine } from '../../engine.js';
import { createDirectionAdapter, renderGrid } from '../../render/grid.js';
import { createState, getView, update } from './dodger.js';

startEngine({
  title: 'Космический уворачивальщик',
  adapter: createDirectionAdapter(),
  render: renderGrid,
  createState,
  update,
  getView,
  tickRateMs: 100,
});
