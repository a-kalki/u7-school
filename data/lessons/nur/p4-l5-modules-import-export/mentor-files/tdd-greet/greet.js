console.log('[greet.js] начало загрузки');

import { exclaim } from './utils.js';

console.log('[greet.js] после импорта');

export function greet(name) {
  console.log('greet runned by:', name);
  if (!name) {
    name = 'незнакомец';
  }
  return exclaim('Привет, ' + name);
}

console.log('[greet.js] конец загрузки');
