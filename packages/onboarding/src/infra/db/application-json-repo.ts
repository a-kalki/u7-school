import type { BaseJsonDb } from "@u7/core/infra";
import { JsonFileRepo } from "@u7/core/infra";
import type { Application } from "#domain/application/entity";
import { ApplicationSchema } from "#domain/application/entity";
import type {
	ApplicationListFilter,
	ApplicationRepo,
} from "#domain/application/repo";

/**
 * JSON-файловая реализация репозитория заявок.
 * Хранит данные в JSON-файле через {@link JsonFileRepo}.
 */
export class ApplicationJsonRepo implements ApplicationRepo {
	readonly #repo: JsonFileRepo<Application>;

	/**
	 * @param filePath — путь к JSON-файлу (по умолчанию "data/onboarding/applications.json")
	 * @param db — опционально: экземпляр BaseJsonDb для транзакционной поддержки
	 */
	constructor(filePath = "data/onboarding/applications.json", db?: BaseJsonDb) {
		this.#repo = new JsonFileRepo(
			ApplicationSchema,
			filePath,
			db,
			"applications",
		);
	}

	async save(application: Application): Promise<void> {
		const all = await this.#repo.readAll();
		const idx = all.findIndex((a) => a.uuid === application.uuid);

		if (idx !== -1) {
			all[idx] = application;
		} else {
			all.push(application);
		}

		await this.#repo.writeAll(all);
	}

	async getByUuid(uuid: string): Promise<Application | undefined> {
		const all = await this.#repo.readAll();
		return all.find((a) => a.uuid === uuid);
	}

	async getByUserId(userId: string): Promise<Application | undefined> {
		const all = await this.#repo.readAll();
		return all.find((a) => a.userId === userId);
	}

	async getAll(filter?: ApplicationListFilter): Promise<Application[]> {
		let applications = await this.#repo.readAll();

		if (filter) {
			if (filter.status) {
				applications = applications.filter((a) => a.status === filter.status);
			}

			if (filter.sort) {
				const [field, dir] = filter.sort.split(":") as [
					"createdAt" | "submittedAt",
					"asc" | "desc",
				];
				const multiplier = dir === "asc" ? 1 : -1;
				applications.sort((a, b) => {
					const va = a[field];
					const vb = b[field];
					if (va < vb) return -1 * multiplier;
					if (va > vb) return 1 * multiplier;
					return 0;
				});
			}

			if (filter.limit !== undefined) {
				applications = applications.slice(0, filter.limit);
			}
		}

		return applications;
	}

	async hasApplicationForUser(userId: string): Promise<boolean> {
		const all = await this.#repo.readAll();
		return all.some((a) => a.userId === userId);
	}
}
