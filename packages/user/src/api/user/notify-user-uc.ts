import * as v from 'valibot';
import { UserUseCase } from '#api/user-uc';
import {
  type NotifyUserCmd,
  type NotifyUserCmdMeta,
  NotifyUserCmdSchema,
} from '#domain/user/commands/notify-user-cmd';
import type { UserNotifiedEvent } from '#domain/user/events';

/**
 * Use-case уведомления пользователя — единый механизм для всех отправителей.
 */
export class NotifyUserUc extends UserUseCase<NotifyUserCmdMeta> {
  protected readonly ucName = 'notify-user' as const;
  protected readonly ucLabel = 'Уведомить пользователя' as const;
  protected readonly arMeta = {
    arName: 'User' as const,
    arLabel: 'Пользователь' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = NotifyUserCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(command: NotifyUserCmd): Promise<undefined> {
    const event: UserNotifiedEvent = {
      eventId: crypto.randomUUID(),
      eventName: 'user.notified',
      occurredAt: new Date().toISOString(),
      aggregateName: 'User',
      aggregateId: command.userId,
      payload: {
        userId: command.userId,
        text: command.text,
      },
    };
    this.resolve.eventBus.publish(event);
    return undefined;
  }
}
