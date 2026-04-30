#!/usr/bin/env bun
import { parseArgs } from "./args";

function showHelp() {
  console.log(`
Использование: w3s <команда> [аргументы]

Команды:
  status  - Проверить состояние локального хранилища контента
  parse   - Запустить парсинг скачанных HTML-файлов
  enrich  - Обогатить данные курсов через ИИ (генерация сводок)
  help    - Показать эту справку
`);
}

async function main() {
  const { command } = parseArgs(process.argv.slice(2));

  switch (command) {
    case "status":
      console.log("Выполнение команды: status (в разработке)");
      break;
    case "parse":
      console.log("Выполнение команды: parse (в разработке)");
      break;
    case "enrich":
      console.log("Выполнение команды: enrich (в разработке)");
      break;
    default:
      showHelp();
      break;
  }
}

await main();
