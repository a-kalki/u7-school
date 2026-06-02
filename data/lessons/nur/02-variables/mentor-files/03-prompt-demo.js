// prompt() — останавливает поток выполнения до ввода пользователя
// Работает и в браузере, и в Bun (терминал)

const name = prompt('Как тебя зовут?');  // 🔴 поток остановится здесь!
console.log('Привет, ' + name + '!');

const age = prompt('Сколько тебе лет?'); // 🔴 снова остановка

const currentYear = new Date().getFullYear();
const birthYear = currentYear - Number(age);

console.log(name + ', похоже ты родился в ' + birthYear + ' году.');
console.log('Программа завершена.');

// Сколько раз останавливался поток выполнения?
