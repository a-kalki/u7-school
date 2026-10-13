#!/usr/bin/env bun
/**
 * Выводит список доступных тестовых миров и их хеши.
 *
 * Использование:
 *   bun run world:list
 */

import { formatWorldList } from '../tests/worlds';

function main() {
  const output = formatWorldList();
  console.log(output);
}

main();
