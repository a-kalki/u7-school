import { Aggregate } from "@u7/core/domain";
import { isoNow } from "@u7/core/shared";
import type { CreateApplicationCmd } from "./commands/create-application-cmd";
import type { UpdateApplicationCmd } from "./commands/update-application-cmd";
import type { Application, ApplicationArMeta } from "./entity";
import { ApplicationSchema } from "./entity";
import { ApplicationStatus } from "./status";

/**
 * Агрегат заявки кандидата.
 * Инкапсулирует состояние Application и логику его изменения.
 */
export class ApplicationAr extends Aggregate<ApplicationArMeta> {
  static readonly arName = "Application";
  static readonly arLabel = "Заявка";

  constructor(state: Application) {
    super(state, ApplicationSchema);
  }

  /**
   * Фабричный метод создания новой заявки из команды.
   */
  static create(command: CreateApplicationCmd): ApplicationAr {
    const now = isoNow();
    const candidate: Application = {
      uuid: crypto.randomUUID(),
      userId: command.userId,
      status: ApplicationStatus.SUBMITTED,
      answers: command.answers,
      createdAt: now,
      submittedAt: now,
    };

    return new ApplicationAr(candidate);
  }

  /**
   * Частичное обновление ответов заявки.
   */
  updateAnswers(command: UpdateApplicationCmd): void {
    this.safeUpdate({
      answers: command.answers,
    });
  }
}
