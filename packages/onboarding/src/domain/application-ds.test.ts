import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { BaseJsonDb } from "@u7/core/infra";
import { UserJsonRepo } from "@u7/user/infra";
import { Role } from "@u7/user/domain";
import type { User } from "@u7/user/domain";
import { ApplicationDs } from "./application-ds";
import { ApplicationJsonRepo } from "#infra/db/application-json-repo";
import { Experience } from "./application/experience";
import { Format } from "./application/format";
import { Goals } from "./application/goals";
import { Intensity } from "./application/intensity";
import { Source } from "./application/source";

const tmpDir = mkdtempSync("/tmp/onboarding-ds-test-");

function nextPath(prefix: string): string {
  return join(tmpDir, `${prefix}.json`);
}

function makeUser(overrides?: Partial<User>): User {
  return {
    uuid: crypto.randomUUID(),
    name: "Тест",
    telegramId: 1,
    roles: [Role.GUEST],
    createdAt: "2024-01-01T00:00",
    ...overrides,
  };
}

describe("ApplicationDs", () => {
  let db: BaseJsonDb;
  let applicationRepo: ApplicationJsonRepo;
  let userRepo: UserJsonRepo;
  let ds: ApplicationDs;

  beforeEach(() => {
    db = new BaseJsonDb();
    applicationRepo = new ApplicationJsonRepo(nextPath("applications"), db);
    userRepo = new UserJsonRepo(nextPath("users"), undefined, db);
    ds = new ApplicationDs(applicationRepo, userRepo, db);
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("создаёт заявку и добавляет роль CANDIDATE", async () => {
    const user = makeUser();
    await userRepo.save(user);

    const command = {
      userId: user.uuid,
      answers: {
        source: Source.TELEGRAM,
        interestReason: "Хочу учиться",
        experience: Experience.BEGINNER,
        format: Format.ONLINE,
        goals: Goals.CAREER_CHANGE,
        intensity: Intensity.BASE,
      },
    };

    const application = await ds.createApplication(command, user);

    expect(application.userId).toBe(user.uuid);
    expect(application.status).toBe("SUBMITTED");

    // Проверяем, что роль добавлена
    const updatedUser = await userRepo.getByUuid(user.uuid);
    expect(updatedUser?.roles).toContain(Role.CANDIDATE);

    // Проверяем, что заявка сохранена
    const savedApp = await applicationRepo.getByUuid(application.uuid);
    expect(savedApp).toBeDefined();
    expect(savedApp?.answers.interestReason).toBe("Хочу учиться");
  });

  test("не создаёт дублирующую заявку", async () => {
    const user = makeUser();
    await userRepo.save(user);

    const command = {
      userId: user.uuid,
      answers: {
        source: Source.TELEGRAM,
        interestReason: "Хочу учиться",
        experience: Experience.BEGINNER,
        format: Format.ONLINE,
        goals: Goals.CAREER_CHANGE,
        intensity: Intensity.BASE,
      },
    };

    await ds.createApplication(command, user);

    await expect(ds.createApplication(command, user)).rejects.toThrow(
      "Заявка для данного пользователя уже существует",
    );
  });

  test("откатывает транзакцию при ошибке сохранения пользователя", async () => {
    const user = makeUser();
    await userRepo.save(user);

    // Создаём ApplicationDs с "сломанным" userRepo
    const brokenUserRepo = {
      save: async () => {
        throw new Error("Ошибка сохранения пользователя");
      },
      getByUuid: userRepo.getByUuid.bind(userRepo),
      getAll: userRepo.getAll.bind(userRepo),
      getByTelegramId: userRepo.getByTelegramId.bind(userRepo),
      isTelegramIdTaken: userRepo.isTelegramIdTaken.bind(userRepo),
      isEmpty: userRepo.isEmpty.bind(userRepo),
    };

    const brokenDs = new ApplicationDs(applicationRepo, brokenUserRepo as typeof userRepo, db);

    const command = {
      userId: user.uuid,
      answers: {
        source: Source.TELEGRAM,
        interestReason: "Хочу учиться",
        experience: Experience.BEGINNER,
        format: Format.ONLINE,
        goals: Goals.CAREER_CHANGE,
        intensity: Intensity.BASE,
      },
    };

    await expect(brokenDs.createApplication(command, user)).rejects.toThrow(
      "Ошибка сохранения пользователя",
    );

    // Заявка не должна быть сохранена (транзакция откачена)
    const savedApp = await applicationRepo.getByUserId(user.uuid);
    expect(savedApp).toBeUndefined();

    // Пользователь не должен измениться
    const unchangedUser = await userRepo.getByUuid(user.uuid);
    expect(unchangedUser?.roles).not.toContain(Role.CANDIDATE);
  });

  test("требует существующего пользователя", async () => {
    const user = makeUser();
    // Не сохраняем пользователя

    const command = {
      userId: user.uuid,
      answers: {
        source: Source.TELEGRAM,
        interestReason: "Хочу учиться",
        experience: Experience.BEGINNER,
        format: Format.ONLINE,
        goals: Goals.CAREER_CHANGE,
        intensity: Intensity.BASE,
      },
    };

    await expect(ds.createApplication(command, user)).rejects.toThrow(
      "Пользователь не найден",
    );
  });

  test("любой пользователь может создать заявку", async () => {
    const user = makeUser({ roles: [Role.GUEST] });
    await userRepo.save(user);

    const command = {
      userId: user.uuid,
      answers: {
        source: Source.TELEGRAM,
        interestReason: "Хочу учиться",
        experience: Experience.BEGINNER,
        format: Format.ONLINE,
        goals: Goals.CAREER_CHANGE,
        intensity: Intensity.BASE,
      },
    };

    const application = await ds.createApplication(command, user);
    expect(application).toBeDefined();
  });
});
