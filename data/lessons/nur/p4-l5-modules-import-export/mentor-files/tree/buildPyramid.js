console.log('[buildPyramid.js] начало загрузки');

import { repeat } from './utils.js';

console.log('[buildPyramid.js] после импорта');

export function buildPyramid(n) {
  console.log('buildPyramid:', n);
  if (n <= 0) return '';
  let result = '';
  for (let i = 1; i <= n; i++) {
    result += repeat(' ', n - i) + repeat('#', 2 * i - 1) + '\n';
  }
  return result;
}

console.log('[buildPyramid.js] конец загрузки');
