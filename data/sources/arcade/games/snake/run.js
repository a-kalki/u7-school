import { startEngine } from '../../engine.js';
import { createDirectionAdapter, renderGrid } from '../../tui/grid.js';
import { createState, getView, update } from './snake.js';

startEngine({
  title: 'Змейка (Snake)',
  adapter: createDirectionAdapter({ eventType: 'CHANGE_DIRECTION' }),
  render: renderGrid,
  createState,
  update,
  getView,
  tickRateMs: 150,
});
