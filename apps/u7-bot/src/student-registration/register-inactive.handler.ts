import type { Logger } from '@u7-scl/core/shared';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import type { Student } from '@u7-scl/stream/domain';
import type { StudentRepo } from '@u7-scl/stream/domain';
import { Role, type UserFacade } from '@u7-scl/user/domain';
import type { Composer } from 'grammy';
import type { BotContext } from '../context';
import {
  STREAM_1_UUID,
  GROUP_CHAT_ID,
  STUDENT_LIST,
  findFirstStepId,
  type StudentEntry,
} from './constants';

// ═══════════════════════════════════════════════════════════════
// Типы
// ═══════════════════════════════════════════════════════════════

interface MinimalCtx {
  from: { id: number; first_name: string };
  reply: (text: string, opts?: { parse_mode?: string }) => Promise<unknown>;
  api: {
    getChatMember: (chatId: string, userId: number) => Promise<{ status: string }>;
  };
}

interface BulkStats {
  added: number;
  skipped: number;
  errors: number;
}

// ═══════════════════════════════════════════════════════════════
// Основная логика (тестируемая)
// ═══════════════════════════════════════════════════════════════

/**
 * Обрабатывает команду /register_inactive.
 */
export async function handleRegisterInactive(
  ctx: MinimalCtx,
  streamUuid: string,
  groupChatId: string,
  studentList: StudentEntry[],
  contentSnapshot: ContentSnapshot,
  userFacade: UserFacade,
  studentRepo: StudentRepo,
  logger?: Logger,
): Promise<void> {
  // ── Шаг 1: Проверить права ADMIN ──
  const actor = await userFacade.getUserByTelegramId(ctx.from.id);
  if (!actor || !actor.roles.includes(Role.ADMIN)) {
    await ctx.reply('⛔ Только администратор может выполнить эту команду\\.', {
      parse_mode: 'MarkdownV2',
    });
    return;
  }

  // ── Шаг 2: Подготовка — найти stepId для p1-l5 ──
  const targetStepId = findFirstStepId(contentSnapshot, 0, 4); // проект 1, урок 5
  if (!targetStepId) {
    await ctx.reply('❌ Урок p1\\-l5 не найден в программе потока\\.', {
      parse_mode: 'MarkdownV2',
    });
    return;
  }

  // ── Шаг 3: Обработка каждого студента ──
  const stats: BulkStats = { added: 0, skipped: 0, errors: 0 };

  for (const entry of studentList) {
    try {
      // a. Найти пользователя
      let user = await userFacade.getUserByUuid(entry.uuid);

      if (!user) {
        // Проверить через getChatMember
        try {
          const member = await ctx.api.getChatMember(groupChatId, entry.telegramId);
          const allowedStatuses = ['member', 'administrator', 'creator'];
          if (allowedStatuses.includes(member.status)) {
            user = await userFacade.registerGuest(entry.telegramId, entry.name, actor.uuid);
          } else {
            stats.errors++;
            continue;
          }
        } catch {
          stats.errors++;
          continue;
        }
      }

      // b. Проверить активную запись
      const records = await studentRepo.getByUser(user.uuid);
      const hasActive = records.some((r) => r.status === 'active');
      if (hasActive) {
        stats.skipped++;
        continue;
      }

      // c. Создать Student запись
      const now = new Date().toISOString();
      const student: Student = {
        uuid: crypto.randomUUID(),
        streamId: streamUuid,
        userId: user.uuid,
        enrolledAt: now,
        status: 'active',
        currentStepId: targetStepId,
        steps: [{ stepId: targetStepId, status: 'issued', issuedAt: now }],
        createdAt: now,
      };

      await studentRepo.save(student);

      // d. Добавить роль STUDENT
      if (!user.roles.includes(Role.STUDENT)) {
        try {
          await userFacade.updateUserRole(user.uuid, Role.STUDENT, actor.uuid);
        } catch {
          // Логируем, но не прерываем
          logger?.error('register-inactive', 'Ошибка добавления роли STUDENT', {
            error: 'updateUserRole failed',
            userId: user.uuid,
          });
        }
      }

      stats.added++;

      // Задержка между студентами чтобы не перегружать систему
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      logger?.error('register-inactive', `Ошибка обработки студента ${entry.name}`, {
        error: String(err),
        entryUuid: entry.uuid,
      });
      stats.errors++;
    }
  }

  // ── Шаг 4: Отчёт ──
  const report = [
    '📊 *Регистрация завершена*',
    '',
    `✅ Добавлено: ${stats.added}`,
    `⏭️ Пропущено \\(уже есть\\): ${stats.skipped}`,
    `❌ Ошибки: ${stats.errors}`,
    '',
    `Всего в списке: ${studentList.length}`,
  ].join('\n');

  await ctx.reply(report, { parse_mode: 'MarkdownV2' });
}

// ═══════════════════════════════════════════════════════════════
// Регистрация команды в Grammy-боте
// ═══════════════════════════════════════════════════════════════

/**
 * Регистрирует временную команду /register_inactive на приватном боте.
 */
export function registerRegisterInactiveCommand(
  bot: Composer<BotContext>,
  contentSnapshot: ContentSnapshot,
  userFacade: UserFacade,
  studentRepo: StudentRepo,
  logger?: Logger,
): void {
  bot.command('register_inactive', async (ctx) => {
    await handleRegisterInactive(
      ctx as unknown as MinimalCtx,
      STREAM_1_UUID,
      GROUP_CHAT_ID,
      STUDENT_LIST,
      contentSnapshot,
      userFacade,
      studentRepo,
      logger,
    );
  });
}
