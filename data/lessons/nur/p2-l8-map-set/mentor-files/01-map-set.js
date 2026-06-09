const ids = [101, 102, 103, 101, 104, 102];
const uniqueIds = new Set(ids);
console.log(uniqueIds.size);
console.log(uniqueIds.has(101));

const blacklist = new Set(['вор', 'мошенник']);
console.log(blacklist.has('Иванов'));
console.log(blacklist.has('вор'));

const userA = { name: 'Иванов' };
const userB = { name: 'Петрова' };
const visits = new Map();
visits.set(userA, 1);
visits.set(userB, 3);
visits.set(userA, visits.get(userA) + 1);

console.log(visits.get(userA));
console.log(visits.get(userB));
console.log(visits.size);

const salaryMap = new Map(Object.entries({ Иванов: 500000, Петрова: 450000 }));
salaryMap.set('Козлова', 520000);
console.log(salaryMap.size);
console.log(salaryMap.keys());
console.log(salaryMap.values());
