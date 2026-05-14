import { ApplicationAr } from "#domain/application/a-root";
import {
  type GetApplicationByUserIdCmd,
  type GetApplicationByUserIdCmdMeta,
  GetApplicationByUserIdCmdSchema,
} from "#domain/application/commands/get-application-by-user-id-cmd";
import type { Application } from "#domain/application/entity";
import { ApplicationSchema } from "#domain/application/entity";
import { OnboardingUseCase } from "../onboarding-uc";

/**
 * Use-case получения заявки по userId.
 */
export class GetApplicationByUserIdUc extends OnboardingUseCase<GetApplicationByUserIdCmdMeta> {
  protected readonly ucName = "get-application-by-user-id" as const;
  protected readonly ucLabel = "Получить заявку по userId" as const;
  protected readonly arMeta = {
    arName: ApplicationAr.arName as "Application",
    arLabel: ApplicationAr.arLabel as "Заявка",
  };
  protected readonly type = "query" as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = GetApplicationByUserIdCmdSchema;
  protected readonly outputSchema = ApplicationSchema;

  async execute(
    command: GetApplicationByUserIdCmd,
    actorId?: string,
  ): Promise<Application> {
    const application = await this.resolve.applicationRepo.getByUserId(
      command.userId,
    );
    if (!application) {
      this.throwError({
        name: "APPLICATION_NOT_FOUND",
        kind: "not-found",
        level: "usecase",
        message: "Заявка не найдена",
        payload: { userId: command.userId },
      });
    }

    const actor = actorId ? await this.getUser(actorId) : undefined;
    return this.getOutApplication(application, actor);
  }
}
