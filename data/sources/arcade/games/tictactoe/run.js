import { startEngine } from '../../engine.js';
import { cursorActionAdapter, renderGrid } from '../../tui/grid.js';
import { createState, getView, update } from './tictactoe.js';

startEngine({
  title: 'Крестики-нолики',
  adapter: cursorActionAdapter,
  render: renderGrid,
  createState,
  update,
  getView,
});
