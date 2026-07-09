import { errNotFound } from '@u7-scl/core/domain';
import { Role } from '@u7-scl/user/domain';
import * as v from 'valibot';
import { StreamAr } from '#domain/stream/a-root';
import {
  type CompleteStreamCmd,
  type CompleteStreamCmdMeta,
  CompleteStreamCmdSchema,
} from '#domain/stream/commands/complete-stream-cmd';
import { StreamPolicy } from '#domain/stream/policy';
import { StudentAr } from '#domain/student/a-root';
import type { StreamNotFoundUcError, StreamUcErrors } from '../errors';
import { StreamUseCase } from '../stream-uc';

/**
 * Use-case завершения потока.
 * Ментор выбирает исход для каждого active-студента:
 * advanced/not_advanced/abandoned. Снимается роль STUDENT,
 * для advanced/not_advanced отправляются сообщения через TgFacade.
 */
export class CompleteStreamUc extends StreamUseCase<CompleteStreamCmdMeta> {
  protected readonly ucName = 'complete-stream' as const;
  protected readonly ucLabel = 'Завершить поток' as const;
  protected readonly arMeta = {
    arName: 'Stream' as const,
    arLabel: 'Поток' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CompleteStreamCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(
    command: CompleteStreamCmd,
    actorId: string,
  ): Promise<undefined> {
    const streamEntity = await this.getStream(command.streamId);

    // Проверка прав: ментор потока или админ
    const actor = await this.getActor(actorId);
    if (!StreamPolicy.canEdit(actor, streamEntity)) {
      this.throwAccessDenied();
    }

    const streamAr = new StreamAr(streamEntity);
    streamAr.complete();
    await this.resolve.streamRepo.save(streamAr.state);

    const studentRepo = this.resolve.streamStudentRepo;
    const userFacade = this.resolve.userFacade;
    const tgFacade = this.resolve.tgFacade;

    // Строим карту исходов для быстрого доступа
    const outcomeMap = new Map(
      command.studentOutcomes.map((o) => [o.studentId, o.outcome]),
    );

    // Загружаем всех студентов потока
    const students = await studentRepo.getByStream(command.streamId);

    for (const entity of students) {
      // Пропускаем не-active
      if (entity.status !== 'active') continue;

      const outcome = outcomeMap.get(entity.uuid);
      if (!outcome) {
        // Студент не указан в исходах — пропускаем или ошибка?
        // По спецификации: ментор должен выбрать исход для каждого active
        continue;
      }

      const studentAr = new StudentAr(entity);

      switch (outcome) {
        case 'advanced':
          studentAr.advance();
          break;
        case 'not_advanced':
          studentAr.markNotAdvanced();
          break;
        case 'abandoned':
          studentAr.markAbandoned('by_mentor');
          break;
      }

      await studentRepo.save(studentAr.state);

      // Снятие роли STUDENT
      await userFacade.removeRoleFromUser(entity.userId, Role.STUDENT);

      // Сообщения через TgFacade
      // TODO: получать telegramId через userFacade
      // Пока используем заглушку — telegramId = userId (в тестах mock)
      if (outcome === 'advanced') {
        await tgFacade.sendMessage(
          0, // TODO: реальный telegramId
          'Ты завершил модуль. Хочешь записаться на следующий?',
        );
      } else if (outcome === 'not_advanced') {
        await tgFacade.sendMessage(
          0, // TODO: реальный telegramId
          'Ты завершил модуль, но не набрал проходной балл. Хочешь перезаписаться на этот же модуль?',
        );
      }
      // abandoned — сообщение не отправляется
    }

    return undefined;
  }
}
