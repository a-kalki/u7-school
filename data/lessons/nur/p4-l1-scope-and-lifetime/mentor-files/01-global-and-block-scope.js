let city = 'Алматы';

{
  let city = 'Астана';
  city = 'Шымкент';
  console.log('внутри:', city);
}
console.log('снаружи:', city);

console.log('');

let total = 0;

{
  let part1 = 100;
  let part2 = 200;
}
{
  let part3 = 300;
  total = part1 + part3;
}
console.log('total:', total);

const country = 'Казахстан';
{
  const city = 'Астана';
  console.log('внутри: страна =', country, 'город =', city);
  if (true) {
    const street = 'Туркестан';
    console.log('глубже: страна =', country, 'улица =', street);
  }
  console.log('после вложенного: улица =', street);
}
