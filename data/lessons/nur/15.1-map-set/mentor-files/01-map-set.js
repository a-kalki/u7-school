console.log('=== Блок 1: Set для уникальных ID сотрудников ===');

// В системе могут быть дубликаты табельных номеров — Set их отсеет
function processEmployeeIds(ids) {
  const uniqueIds = new Set(ids);
  console.log('Всего ID:', ids.length);
  console.log('Уникальных:', uniqueIds.size);

  if (uniqueIds.size < ids.length) {
    console.log('⚠️ Найдены дубликаты! Удалено:', ids.length - uniqueIds.size);
  } else {
    console.log('✅ Дубликатов нет');
  }
}

processEmployeeIds([101, 102, 103, 101, 104, 102]);
processEmployeeIds([201, 202, 203]);

console.log('');

// ============================================================

console.log('=== Блок 2: быстрая проверка через Set.has ===');
// Set.has — O(1), Array.indexOf — O(n)

const blacklist = ['вор', 'мошенник', 'спаммер'];
const blacklistSet = new Set(blacklist);

function isAllowed(user) {
  const result = !blacklistSet.has(user);
  console.log(user, '—', result ? '✅ разрешён' : '❌ заблокирован');
  return result;
}

isAllowed('Иванов');
isAllowed('вор');
isAllowed('мошенник');

console.log('Set.has работает за O(1), indexOf — за O(n).');
console.log('');

// ============================================================

console.log('=== Блок 3: Map с ключами-объектами ===');
// В Object ключи-объекты приводятся к "[object Object]"
// В Map — остаются объектами

function createVisitCounter() {
  const visits = new Map();

  return {
    visit(userObj) {
      const count = visits.get(userObj) || 0;
      visits.set(userObj, count + 1);
    },
    getVisits(userObj) {
      return visits.get(userObj) || 0;
    },
    printAll() {
      console.log('Посещения:');
      for (let [user, count] of visits) {
        console.log('  ' + user.name + ': ' + count);
      }
    }
  };
}

const counter = createVisitCounter();
const user1 = { name: 'Иванов' };
const user2 = { name: 'Петрова' };
const user3 = { name: 'Иванов' };  // другой объект с тем же именем!

counter.visit(user1);
counter.visit(user2);
counter.visit(user3);  // ? Считается как новый или как user1?

counter.printAll();
// ? Сколько уникальных посетителей? Почему user1 и user3 — разные?

console.log('');

// ============================================================

console.log('=== Блок 4: преобразование Object → Map и обратно ===');

const salaryData = {
  Иванов: 500_000,
  Петрова: 450_000,
  Сидоров: 480_000,
};

// Object → Map
const salaryMap = new Map(Object.entries(salaryData));
console.log('Размер Map:', salaryMap.size);
console.log('Оклад Иванова:', salaryMap.get('Иванов'));

// Добавляем в Map
salaryMap.set('Козлова', 520_000);

// Суммируем через for..of
let total = 0;
for (let [name, salary] of salaryMap) {
  total += salary;
}
console.log('ФОТ через Map:', total);

// Map → обратно в Object
const backToObject = Object.fromEntries(salaryMap);
console.log('Обратно в Object:', backToObject);
console.log('');

// ============================================================

console.log('=== Блок 5: когда Object, а когда Map? ===');

// Object — фиксированные строковые ключи
console.log('Object: известные поля сотрудника (name, salary, days)');

// Map — любые ключи (числа, объекты), частые вставки/удаления
const cache = new Map();
const request1 = { url: '/api/salary' };
const request2 = { url: '/api/employees' };
cache.set(request1, { data: [500_000, 450_000], cachedAt: Date.now() });
cache.set(request2, { data: ['Иванов', 'Петрова'], cachedAt: Date.now() });
console.log('Cache size:', cache.size);
// ? Почему для кэша удобнее использовать Map, а не Object?
