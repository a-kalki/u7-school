function calcBonus(salary) {
  const bonus = salary * 0.1;
  console.log('внутри bonus =', bonus);
  return bonus;
}

console.log('результат:', calcBonus(500000));
console.log('снаружи bonus =', bonus);

console.log('');

function checkScope() {
  {
    var a = 'видна';
    let b = 'не видна';
    console.log('блок внутри функции: a =', a, 'b =', b);
  }
  console.log('после блока: a =', a);
  console.log('после блока: b =', b);
}

checkScope();
console.log('снаружи функции: a =', a);
