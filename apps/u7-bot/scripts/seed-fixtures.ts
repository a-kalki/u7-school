/**
 * Скрипт для dev-режима: копирует e2e-фикстуры в data-директорию
 * и привязывает DEV_TELEGRAM_ID ко всем ролям.
 *
 * Использование:
 *   DEV_TELEGRAM_ID=123456789 bun run apps/u7-bot/scripts/seed-fixtures.ts
 *
 * Что делает:
 *   1. Копирует tests/bot/fixtures/templates/ → data/fixtures/
 *   2. Находит ментора (UUID 4444...) и привязывает к DEV_TELEGRAM_ID
 *   3. Даёт ему все роли: GUEST, CANDIDATE, STUDENT, MENTOR, ADMIN
 *   4. Привязывает студента в потоке к этому же пользователю
 */

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Role, type User } from '@u7-scl/user/domain';

const FIXTURES_DIR = path.resolve(
  import.meta.dir,
  '../../../tests/bot/fixtures/templates',
);
const DATA_DIR = path.resolve(import.meta.dir, '../../../data/fixtures');

const MENTOR_UUID = '44444444-4444-4444-4444-444444444444';

async function main() {
  const devTelegramId = process.env.DEV_TELEGRAM_ID;
  if (!devTelegramId) {
    console.error('❌ Укажи DEV_TELEGRAM_ID — твой реальный Telegram ID');
    console.error(
      '   Пример: DEV_TELEGRAM_ID=123456789 bun run apps/u7-bot/scripts/seed-fixtures.ts',
    );
    process.exit(1);
  }

  const id = Number(devTelegramId);
  if (Number.isNaN(id) || id <= 0) {
    console.error(
      '❌ DEV_TELEGRAM_ID должен быть числом (твой Telegram user ID)',
    );
    process.exit(1);
  }

  console.log(`🔧 Настраиваю dev-окружение для Telegram ID: ${id}`);

  // 1. Копируем фикстуры
  await copyFixtures();

  // 2. Патчим users.json: привязываем ментора к dev-аккаунту, даём все роли
  await patchUsers(id);

  // 3. Патчим students.json: привязываем студента к ментору (dev-аккаунту)
  await patchStudents();

  console.log('✅ Готово! Запускай бота:');
  console.log('   DB_DIR=./data/fixtures bun run apps/u7-bot/src/main.ts');
  console.log('');
  console.log(
    '📋 Роли dev-пользователя: GUEST, CANDIDATE, STUDENT, MENTOR, ADMIN',
  );
  console.log('📋 Ты ментор потоков: JS Core Поток 1–4');
  console.log('📋 Ты студент в потоке: JS Core Поток 2 (Активный)');
}

async function copyFixtures() {
  await mkdir(path.join(DATA_DIR, 'users'), { recursive: true });
  await mkdir(path.join(DATA_DIR, 'streams'), { recursive: true });
  await mkdir(path.join(DATA_DIR, 'courses'), { recursive: true });

  const copies: Array<[string, string]> = [
    ['users.json', 'users/users.json'],
    ['streams.json', 'streams/streams.json'],
    ['students.json', 'streams/students.json'],
    ['courses/modules.json', 'courses/modules.json'],
    ['courses/lessons.json', 'courses/lessons.json'],
    ['courses/steps.json', 'courses/steps.json'],
  ];

  for (const [src, dest] of copies) {
    await copyFile(path.join(FIXTURES_DIR, src), path.join(DATA_DIR, dest));
  }

  console.log('📁 Фикстуры скопированы в data/fixtures/');
}

async function patchUsers(devId: number) {
  const usersPath = path.join(DATA_DIR, 'users', 'users.json');
  const raw = await readFile(usersPath, 'utf-8');
  const users = JSON.parse(raw) as User[];

  const mentor = users.find((u) => u.uuid === MENTOR_UUID);
  if (!mentor) {
    console.error('❌ Ментор не найден в users.json');
    process.exit(1);
  }

  // Привязываем ментора к dev-аккаунту и даём все роли
  mentor.telegramId = devId;
  mentor.roles = [
    Role.GUEST,
    Role.CANDIDATE,
    Role.STUDENT,
    Role.MENTOR,
    Role.ADMIN,
  ];
  mentor.name = 'Dev';

  // Удаляем остальных пользователей, чтобы избежать конфликтов
  // Оставляем ментора (dev-аккаунт) и бот-админа (для верификации BOT_ADMIN_UUID)
  const BOT_ADMIN_UUID = 'ae00f3f6-1392-4b98-b178-41c27e794b7f';
  const filtered = users.filter(
    (u) => u.uuid === MENTOR_UUID || u.uuid === BOT_ADMIN_UUID,
  );

  await writeFile(usersPath, JSON.stringify(filtered, null, 2));
  console.log('👤 Пользователь настроен: все роли на одном аккаунте');
}

async function patchStudents() {
  const studentsPath = path.join(DATA_DIR, 'streams', 'students.json');
  const raw = await readFile(studentsPath, 'utf-8');
  const students = JSON.parse(raw);

  // Привязываем студента к dev-аккаунту (ментору)
  for (const s of students) {
    s.userId = MENTOR_UUID; // dev-пользователь = ментор = теперь и студент
  }

  await writeFile(studentsPath, JSON.stringify(students, null, 2));
  console.log('📝 Студент привязан к dev-аккаунту');
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
