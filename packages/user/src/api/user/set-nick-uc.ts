import { errConflict } from '@u7-scl/core/domain';
import * as v from 'valibot';
import { UserUseCase } from '#api/user-uc';
import { UserAr } from '#domain/user/a-root';
import {
  type SetNickCmd,
  type SetNickCmdMeta,
  SetNickCmdSchema,
} from '#domain/user/commands/set-nick-cmd';
import type { NickTakenUcError } from '#domain/user/commands/errors';

/**
 * Use-case установки ника.
 * Пользователь может установить/сменить свой ник.
 */
export class SetNickUc extends UserUseCase<SetNickCmdMeta> {
  protected readonly ucName = 'set-nick' as const;
  protected readonly ucLabel = 'Установить ник' as const;
  protected readonly arMeta = {
    arName: UserAr.arName as 'User',
    arLabel: UserAr.arLabel as 'Пользователь',
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = SetNickCmdSchema;
  protected readonly outputSchema = v.undefined();

  async execute(
    command: SetNickCmd,
    actorId: string,
  ): Promise<undefined> {
    const repo = this.resolve.userRepo;

    const userEntity = await this.getActor(actorId);

    // Проверка уникальности ника (если ник непустой)
    if (command.nick) {
      const taken = await repo.isNickTaken(command.nick);
      if (taken) {
        this.throwError(
          errConflict<NickTakenUcError>(
            'NICK_TAKEN',
            `Ник ${command.nick} уже занят`,
            { nick: command.nick },
          ),
        );
      }
    }

    const ar = new UserAr(userEntity);
    ar.setNick(command.nick ?? '');
    await repo.save(ar.state);

    return undefined;
  }
}
