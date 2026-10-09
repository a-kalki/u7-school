import { startEngine } from '../../engine.js';
import { cursorActionAdapter, renderGrid } from '../../render/grid.js';
import { createState, getView, update } from './tictactoe.js';

startEngine({
  title: 'Крестики-нолики',
  adapter: cursorActionAdapter,
  render: renderGrid,
  createState,
  update,
  getView,
});
