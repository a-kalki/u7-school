// 📁 main.js (точка входа)
console.log('[main.js] начало загрузки');

import { drawTree } from './drawTree.js';

console.log('[main.js] после импортов');

console.log(drawTree(5));

console.log('[main.js] конец загрузки');
