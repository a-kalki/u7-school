const num = 10;
function addFive(n) {
  n = n + 5;
  console.log('  внутри addFive: n =', n);
  return n;
}

console.log('до вызова: num =', num);
const result = addFive(num);
console.log('после вызова: num =', num);
console.log('result =', result);

console.log('');

// ============================================================

const employee = { name: 'Алия', salary: 100000 };
console.log('до вызова:', employee);

function giveBonus(emp, percent) {
  emp.salary = emp.salary + (emp.salary * percent) / 100;
  console.log('  внутри giveBonus:', emp);
}

giveBonus(employee, 10);
console.log('после вызова:', employee);

// если объект изменился, то мы называем это мутацией
// если функция или метод изменяет объект то мы называем его мутабельным

console.log('');

// ============================================================

// защита от мутации — возвращаем новый объект

const emp2 = { name: 'Бек', salary: 80000 };
console.log('до вызова:', emp2);

function giveBonusSafe(emp, percent) {
  const newSalary = emp.salary + (emp.salary * percent) / 100;
  const newEmp = { name: emp.name, salary: newSalary };
  console.log('  внутри giveBonusSafe — новый объект:', newEmp);
  return newEmp;
}

const updated = giveBonusSafe(emp2, 15);
console.log('после вызова: emp2 =', emp2);
console.log('после вызова: updated =', updated);
console.log('emp2 === updated ?', emp2 === updated);

// если функция или метод не меняет объект и возвращает новый,
// то мы говорим что он иммутабельный
// мы стремимся чтобы наши функции и методы были иммутабельными

console.log('');

// ============================================================

const arr = [1, 2, 3];
console.log('до вызова:', arr);

function addItem(list, item) {
  list.push(item);
  console.log('  внутри addItem:', list);
}

addItem(arr, 4);
console.log('после вызова:', arr);
console.log('массив тоже изменился — передан по ссылке');
