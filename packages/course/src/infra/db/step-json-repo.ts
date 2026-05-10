import { JsonFileRepo } from "@u7/core/infra";
import type { Step } from "#domain/step/entity";
import { StepSchema } from "#domain/step/entity";
import type { StepRepo } from "#domain/step/repo";

/**
 * JSON-файловая реализация репозитория шагов.
 * Хранит данные в JSON-файле через {@link JsonFileRepo}.
 */
export class StepJsonRepo implements StepRepo {
  readonly #repo: JsonFileRepo<Step>;

  constructor(filePath = "data/courses/steps.json") {
    this.#repo = new JsonFileRepo(StepSchema, filePath);
  }

  async save(step: Step): Promise<void> {
    const all = await this.#repo.readAll();
    const idx = all.findIndex((s) => s.uuid === step.uuid);
    if (idx !== -1) {
      all[idx] = step;
    } else {
      all.push(step);
    }
    await this.#repo.writeAll(all);
  }

  async getByUuid(uuid: string): Promise<Step | undefined> {
    const all = await this.#repo.readAll();
    return all.find((s) => s.uuid === uuid);
  }

  async getByIds(ids: string[]): Promise<Step[]> {
    const all = await this.#repo.readAll();
    return all.filter((s) => ids.includes(s.uuid));
  }
}
