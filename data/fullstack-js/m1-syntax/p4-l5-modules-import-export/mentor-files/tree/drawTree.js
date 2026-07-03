console.log('[drawTree.js] начало загрузки');

import { buildPyramid } from './buildPyramid.js';

console.log('[drawTree.js] после импорта');

export function drawTree(height) {
  console.log('drawTree:', height);
  if (height <= 0) return '';
  let result = buildPyramid(height);

  const stemHeight = Math.round(height / 3);
  result +=
    stemHeight === 0
      ? ''
      : new Array(stemHeight)
          .fill()
          .map((_n) => ' '.repeat(height - 1) + '#')
          .join('\n');
  return result;
}

console.log('[drawTree.js] конец загрузки');
