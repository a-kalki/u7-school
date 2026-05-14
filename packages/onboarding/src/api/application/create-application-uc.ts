import { ApplicationDs } from "#domain/application-ds";
import { ApplicationAr } from "#domain/application/a-root";
import {
  type CreateApplicationCmd,
  type CreateApplicationCmdMeta,
  CreateApplicationCmdSchema,
} from "#domain/application/commands/create-application-cmd";
import type {
  AccessDeniedUcError,
  ApplicationAlreadyExistsUcError,
} from "#domain/application/commands/errors";
import type { Application } from "#domain/application/entity";
import { ApplicationSchema } from "#domain/application/entity";
import { ApplicationPolicy } from "#domain/application/policy";
import { OnboardingUseCase } from "../onboarding-uc";

/**
 * Use-case создания заявки.
 * Атомарно создаёт заявку и добавляет роль CANDIDATE пользователю.
 */
export class CreateApplicationUc extends OnboardingUseCase<CreateApplicationCmdMeta> {
  protected readonly ucName = "create-application" as const;
  protected readonly ucLabel = "Создать заявку" as const;
  protected readonly arMeta = {
    arName: ApplicationAr.arName as "Application",
    arLabel: ApplicationAr.arLabel as "Заявка",
  };
  protected readonly type = "command" as const;
  protected readonly requiresAuth = true as const;
  protected readonly inputSchema = CreateApplicationCmdSchema;
  protected readonly outputSchema = ApplicationSchema;

  async execute(
    command: CreateApplicationCmd,
    actorId: string,
  ): Promise<Application> {
    const actor = await this.getActor(actorId);

    if (!ApplicationPolicy.canCreate(actor)) {
      this.throwAccessDenied("Недостаточно прав для создания заявки");
    }

    const ds = new ApplicationDs(
      this.resolve.applicationRepo,
      this.resolve.userRepo,
      this.resolve.db,
    );

    try {
      const application = await ds.createApplication(command, actor);
      return application;
    } catch (error) {
      // Перехватываем ошибки доменного сервиса и преобразуем в типизированные
      if (error instanceof Error) {
        if (error.message.includes("уже существует")) {
          this.throwError(
            {
              name: "APPLICATION_ALREADY_EXISTS",
              kind: "conflict",
              level: "usecase",
              message: error.message,
              payload: { userId: command.userId },
            } as ApplicationAlreadyExistsUcError,
          );
        }
      }
      throw error;
    }
  }
}
