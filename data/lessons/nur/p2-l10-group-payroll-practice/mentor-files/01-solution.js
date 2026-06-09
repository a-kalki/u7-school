// Полное решение: расчёт зарплаты отдела маркетинга

const employees = ['Иванов', 'Петрова', 'Сидоров', 'Козлова'];

const salaries = {
  Иванов: 500000,
  Петрова: 450000,
  Сидоров: 480000,
  Козлова: 520000,
};

const workDays = {
  Иванов: 20,
  Петрова: 18,
  Сидоров: 22,
  Козлова: 20,
};

const WORK_DAYS_IN_MONTH = 22;
const OPV_RATE = 0.1;
const IPN_RATE = 0.1;

// === Этап 1: данные и проверка структуры ===
console.log('=== Сотрудники отдела маркетинга ===');
for (const name of employees) {
  console.log(
    name +
      ': оклад ' +
      salaries[name] +
      ', отработано ' +
      workDays[name] +
      ' дней',
  );
}

// === Этап 2 + 3: расчёт для каждого + итоги ===
console.log('\n=== Расчёт зарплаты ===');

let totalAccrued = 0;
let totalOpv = 0;
let totalIpn = 0;
let totalPay = 0;
let fullMonthCount = 0;

for (const name of employees) {
  const accrued = Math.round(
    (salaries[name] / WORK_DAYS_IN_MONTH) * workDays[name],
  );
  const opv = Math.round(accrued * OPV_RATE);
  const ipn = Math.round((accrued - opv) * IPN_RATE);
  const pay = accrued - opv - ipn;

  console.log(
    name +
      ': начислено ' +
      accrued +
      ', ОПВ ' +
      opv +
      ', ИПН ' +
      ipn +
      ', на руки ' +
      pay,
  );

  totalAccrued += accrued;
  totalOpv += opv;
  totalIpn += ipn;
  totalPay += pay;

  if (workDays[name] === WORK_DAYS_IN_MONTH) {
    fullMonthCount++;
  }
}

console.log('\n=== Итоги по отделу ===');
console.log(`Общий фонд оплаты: ${totalAccrued} тг`);
console.log(`Всего удержано ОПВ: ${totalOpv} тг`);
console.log(`Всего удержано ИПН: ${totalIpn} тг`);
console.log(`Всего к выплате:   ${totalPay} тг`);
console.log(`Полный месяц: ${fullMonthCount} сотрудников`);
