console.log('[utils.js] начало загрузки');

export function repeat(char, count) {
  let result = '';
  for (let i = 0; i < count; i++) result += char;
  return result;
}

console.log('[utils.js] конец загрузки');
