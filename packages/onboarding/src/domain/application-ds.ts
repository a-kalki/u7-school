import type { BaseJsonDb } from "@u7/core/infra";
import type { User } from "@u7/user/domain";
import { UserAr } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import type { UserRepo } from "@u7/user/domain";
import { ApplicationAr } from "./application/a-root";
import type { CreateApplicationCmd } from "./application/commands/create-application-cmd";
import type { Application } from "./application/entity";
import { ApplicationPolicy } from "./application/policy";
import type { ApplicationRepo } from "./application/repo";

/**
 * Доменный сервис заявок.
 * Атомарно создаёт заявку и добавляет роль CANDIDATE пользователю.
 */
export class ApplicationDs {
  constructor(
    private readonly applicationRepo: ApplicationRepo,
    private readonly userRepo: UserRepo,
    private readonly db: BaseJsonDb,
  ) {}

  /**
   * Создаёт заявку и добавляет роль CANDIDATE пользователю атомарно.
   */
  async createApplication(
    command: CreateApplicationCmd,
    actor: User,
  ): Promise<Application> {
    // Проверка политики
    if (!ApplicationPolicy.canCreate(actor)) {
      throw new Error("Недостаточно прав для создания заявки");
    }

    // Проверка существования пользователя
    const user = await this.userRepo.getByUuid(command.userId);
    if (!user) {
      throw new Error("Пользователь не найден");
    }

    // Проверка уникальности заявки для пользователя
    if (await this.applicationRepo.hasApplicationForUser(command.userId)) {
      throw new Error("Заявка для данного пользователя уже существует");
    }

    // Начинаем транзакцию
    this.db.begin();

    try {
      // Создаём заявку
      const appAr = ApplicationAr.create(command);
      await this.applicationRepo.save(appAr.state);

      // Добавляем роль CANDIDATE
      const userAr = new UserAr(user);
      userAr.addRole(Role.CANDIDATE);
      await this.userRepo.save(userAr.state);

      // Фиксируем транзакцию
      await this.db.commit();

      return appAr.state;
    } catch (error) {
      // Откатываем при ошибке
      this.db.rollback();
      throw error;
    }
  }
}
