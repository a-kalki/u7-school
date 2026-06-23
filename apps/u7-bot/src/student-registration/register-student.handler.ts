import type { Logger } from '@u7-scl/core/shared';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import type { Student, StudentRepo } from '@u7-scl/stream/domain';
import { Role, type User, type UserFacade } from '@u7-scl/user/domain';
import type { Composer } from 'grammy';
import type { BotContext } from '../context';
import {
  buildStepLabel,
  findFirstStepId,
  findStudentByTelegramId,
  GROUP_CHAT_ID,
  parseLessonLabel,
  STREAM_1_UUID,
} from './constants';

// ═══════════════════════════════════════════════════════════════
// Типы для Grammy-контекста (упрощённые, для тестируемости)
// ═══════════════════════════════════════════════════════════════

interface MinimalCtx {
  from: { id: number; first_name: string };
  message: { text: string };
  reply: (text: string, opts?: { parse_mode?: string }) => Promise<unknown>;
  api: {
    getChatMember: (
      chatId: string,
      userId: number,
    ) => Promise<{ status: string }>;
  };
}

// ═══════════════════════════════════════════════════════════════
// Основная логика команды (тестируемая)
// ═══════════════════════════════════════════════════════════════

/**
 * Обрабатывает команду /register_student.
 *
 * Вынесена в отдельную функцию для тестируемости.
 * Не зависит от Grammy-типов напрямую — использует MinimalCtx.
 */
export async function handleRegisterStudent(
  ctx: MinimalCtx,
  streamUuid: string,
  groupChatId: string,
  contentSnapshot: ContentSnapshot,
  userFacade: UserFacade,
  studentRepo: StudentRepo,
  logger?: Logger,
): Promise<void> {
  const telegramId = ctx.from.id;

  // ── Шаг 1: Разрешить пользователя ──
  let user: User | undefined = await userFacade.getUserByTelegramId(telegramId);
  if (!user) {
    try {
      user = await userFacade.registerGuest(
        telegramId,
        ctx.from.first_name || 'Гость',
        '', // actorId не требуется для registerGuest
      );
    } catch {
      await ctx.reply('⚠️ Не удалось определить пользователя. Попробуй позже.');
      return;
    }
  }

  // ── Шаг 2: Проверить членство в группе ──
  const isInList = findStudentByTelegramId(telegramId) !== undefined;

  if (!isInList) {
    try {
      const member = await ctx.api.getChatMember(groupChatId, telegramId);
      const allowedStatuses = ['member', 'administrator', 'creator'];
      if (!allowedStatuses.includes(member.status)) {
        await ctx.reply('❌ Ты не являешься участником группы потока.');
        return;
      }
      // Пользователь в группе, но не в списке — ок, продолжаем
    } catch {
      await ctx.reply(
        '⚠️ Не удалось проверить членство в группе. Попробуй позже.',
      );
      return;
    }
  }

  // ── Шаг 3: Проверить отсутствие активной записи Student ──
  const records = await studentRepo.getByUser(user.uuid);

  const activeInStream1 = records.find(
    (r) => r.status === 'active' && r.streamId === streamUuid,
  );
  if (activeInStream1) {
    const stepLabel = buildStepLabel(
      contentSnapshot,
      activeInStream1.currentStepId,
    );
    await ctx.reply(
      `ℹ️ Ты уже зарегистрирован в потоке\\.\n📌 Текущее задание: ${escapeMd(stepLabel)}`,
      { parse_mode: 'MarkdownV2' },
    );
    return;
  }

  const activeInOther = records.find(
    (r) => r.status === 'active' && r.streamId !== streamUuid,
  );
  if (activeInOther) {
    await ctx.reply('⚠️ Ты уже проходишь обучение в другом потоке\\.', {
      parse_mode: 'MarkdownV2',
    });
    return;
  }

  // ── Шаг 4: Парсить аргумент урока ──
  const rawText = ctx.message.text;
  const argPart = rawText.replace(/^\/register_student\b/, '').trim();
  const lessonLabel = argPart || 'p4-l1';

  const parsed = parseLessonLabel(lessonLabel);
  if (!parsed) {
    await ctx.reply(
      '❌ Неверный формат урока\\. Используй: `/register_student pN\\-lM` \\(например `p4\\-l1`\\)',
      { parse_mode: 'MarkdownV2' },
    );
    return;
  }

  // ── Шаг 5: Найти stepId в contentSnapshot ──
  const stepId = findFirstStepId(
    contentSnapshot,
    parsed.projectIndex,
    parsed.lessonIndex,
  );
  if (!stepId) {
    await ctx.reply(
      `❌ Урок \`${escapeMd(lessonLabel)}\` не найден в программе потока\\. Проверь номер\\.`,
      { parse_mode: 'MarkdownV2' },
    );
    return;
  }

  // ── Шаг 6: Создать Student запись ──
  const now = new Date().toISOString();
  const student: Student = {
    uuid: crypto.randomUUID(),
    streamId: streamUuid,
    userId: user.uuid,
    enrolledAt: now,
    status: 'active',
    currentStepId: stepId,
    steps: [{ stepId, status: 'issued', issuedAt: now }],
    createdAt: now,
  };

  // Данные уже соответствуют типу Student

  try {
    await studentRepo.save(student);
  } catch (err) {
    logger?.error('register-student', 'Ошибка сохранения Student', {
      error: String(err),
      userId: user.uuid,
    });
    await ctx.reply(
      '⚠️ Не удалось создать запись студента\\. Попробуй позже\\.',
      {
        parse_mode: 'MarkdownV2',
      },
    );
    return;
  }

  // ── Шаг 7: Добавить роль STUDENT ──
  if (!user.roles.includes(Role.STUDENT)) {
    try {
      await userFacade.updateUserRole(user.uuid, Role.STUDENT, user.uuid);
    } catch (err) {
      // Логируем, но не прерываем — студент уже создан
      logger?.error('register-student', 'Ошибка добавления роли STUDENT', {
        error: String(err),
        userId: user.uuid,
      });
    }
  }

  // ── Шаг 8: Ответ пользователю ──
  const stepLabel = buildStepLabel(contentSnapshot, stepId);
  await ctx.reply(
    [
      '🎉 *Ты зарегистрирован в потоке «Основы JS\\. Синтаксис — 1»\\!*',
      '',
      `📌 Текущее задание: ${escapeMd(stepLabel)}`,
      '',
      'Используй кнопку «📖 Моя учёба» для продолжения обучения\\.',
    ].join('\n'),
    { parse_mode: 'MarkdownV2' },
  );
}

// ═══════════════════════════════════════════════════════════════
// Регистрация команды в Grammy-боте
// ═══════════════════════════════════════════════════════════════

/**
 * Регистрирует временную команду /register_student на приватном боте.
 *
 * @param bot — приватный Grammy-композер (только личные чаты)
 * @param contentSnapshot — снимок контента потока 1
 * @param userFacade — фасад пользователей
 * @param studentRepo — репозиторий студентов
 */
export function registerRegisterStudentCommand(
  bot: Composer<BotContext>,
  contentSnapshot: ContentSnapshot,
  userFacade: UserFacade,
  studentRepo: StudentRepo,
  logger?: Logger,
): void {
  bot.command('register_student', async (ctx) => {
    await handleRegisterStudent(
      ctx as unknown as MinimalCtx,
      STREAM_1_UUID,
      GROUP_CHAT_ID,
      contentSnapshot,
      userFacade,
      studentRepo,
      logger,
    );
  });
}

// ═══════════════════════════════════════════════════════════════
// Хелперы
// ═══════════════════════════════════════════════════════════════

/** Экранирует специальные символы Telegram MarkdownV2 */
function escapeMd(text: string): string {
  return text.replace(/[_*[\]()~>#+\-=|{}.!]/g, '\\$&');
}
