// Логические операторы: практические примеры
const age = 20;
const hasLicense = true;

// && — оба условия должны быть истинны
const canDrive = age >= 18 && hasLicense;
console.log('canDrive:', canDrive);

const minor = age < 18;
const noLicense = !hasLicense;
console.log('minor && noLicense:', minor && noLicense);

// || — хотя бы одно истинно
const isWeekend = true;
const isHoliday = false;
const canRest = isWeekend || isHoliday;
console.log('canRest:', canRest);

// Комбинирование && и ||
const hasEnoughMoney = true;
const hasCoupon = false;
const isSaleDay = true;

const canBuy = hasEnoughMoney && (hasCoupon || isSaleDay);
console.log('canBuy:', canBuy);

// Реальный сценарий: проверка доступа
const isAdmin = false;
const isModerator = true;
const isBanned = false;

const canAccess = (isAdmin || isModerator) && !isBanned;
console.log('canAccess:', canAccess);

// Проверка диапазона
const temperature = 25;
const isComfortable = temperature >= 18 && temperature <= 26;
console.log('isComfortable:', isComfortable);

const isUncomfortable = temperature < 15 || temperature > 30;
console.log('isUncomfortable:', isUncomfortable);

// Одно из двух ||
const firstPersonAge = 6;
const secondPersonAge = о15;

const canEnter = firstPersonAge > 18 || secondPersonAge > 18;
console.log('canEnter:', canEnter);

// Все условия ложны
const isSunny = false;
const isWarm = false;
const goForWalk = isSunny && isWarm;
console.log('goForWalk:', goForWalk);
