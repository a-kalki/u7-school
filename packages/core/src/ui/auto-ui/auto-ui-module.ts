import type * as v from "valibot";
import type { Module } from "#api/module/module";
import type { UcDocType } from "#api/uc/use-case";
import type { ModuleMeta } from "#domain/module/types";
import type { UIAppResolver } from "#ui/ui-base/ui-app";
import { UIModule, type UIModuleResolver } from "#ui/ui-base/ui-module";
import type { UIIntent } from "./command-parser";

export interface AutoUiModuleResolver<TMeta extends ModuleMeta>
  extends UIModuleResolver {
  apiModule: Module<TMeta, unknown>;
}

export abstract class AutoUiModule<
  TMeta extends ModuleMeta,
  AR extends UIAppResolver = UIAppResolver,
  MR extends AutoUiModuleResolver<TMeta> = AutoUiModuleResolver<TMeta>,
> extends UIModule<TMeta, AR, MR> {
  render(): unknown {
    return this.renderAbout();
  }

  /**
   * Обработка намерений от AutoUiApp
   */
  async handleIntent(intent: UIIntent): Promise<string> {
    if (intent.type === "module") {
      if (intent.command === "about") {
        return this.renderAbout();
      }
      if (intent.command === "aggregates") {
        return this.renderAggregates();
      }
      if (intent.command === "usecases") {
        return this.renderUseCases(intent.aggregateName);
      }
    }

    if (intent.type === "usecase") {
      const ucName = intent.commandName;
      if (intent.action === "prompt") {
        return this.renderUseCasePrompt(ucName);
      }
      if (intent.action === "execute") {
        return this.executeUseCase(ucName, intent.payload);
      }
    }

    return `Неизвестная команда модуля ${this.name}`;
  }

  private renderAbout(): string {
    const title = this.about?.title ? `**${this.about.title}**\n\n` : "";
    const body = this.about?.body || `Добро пожаловать в модуль ${this.name}!`;
    const menu = `\n\n--- \n**Меню:**\n- Продолжить: /${this.name}/aggregates\n- Назад: /app`;
    return `${title}${body}${menu}`;
  }

  private renderAggregates(): string {
    const aggregates = new Set<string>();
    const aggregateLabels = new Map<string, string>();

    for (const uc of this.getDocTypes()) {
      aggregates.add(uc.arName);
      aggregateLabels.set(uc.arName, uc.arLabel);
    }

    let result = `**Доступные объекты (${this.name}):**\n\n`;
    for (const agg of aggregates) {
      const label = aggregateLabels.get(agg);
      result += `- ${label} (${agg}): /${this.name}/${agg}\n`;
    }
    result += `\n---\n**Назад:** /${this.name}`;
    return result;
  }

  private renderUseCases(aggregateName: string): string {
    const useCases = this.getDocTypes().filter(
      (uc) => uc.arName === aggregateName,
    );

    if (useCases.length === 0) {
      return `Ошибка: Объект '${aggregateName}' не найден.\nНазад: /${this.name}/aggregates`;
    }

    // biome-ignore lint/style/noNonNullAssertion: проверены выше;
    const label = useCases[0]!.arLabel;
    let result = `**Команды для "${label}":**\n\n`;
    for (const uc of useCases) {
      result += `- ${uc.description}: /${this.name}/${aggregateName}/${uc.commandName}\n`;
    }
    result += `\n---\n**Назад:** /${this.name}/aggregates`;
    return result;
  }

  private renderUseCasePrompt(commandName: string): string {
    const uc = this.getDocTypes().find((u) => u.commandName === commandName);
    if (!uc) {
      return `Ошибка: Команда '${commandName}' не найдена.`;
    }

    let fieldsPrompt = "";
    const schema = uc.inputSchema as v.BaseSchema<
      unknown,
      unknown,
      v.BaseIssue<unknown>
    >;

    if (schema && typeof schema === "object" && "entries" in schema) {
      // @ts-expect-error: схема будет валидной
      const keys = Object.keys(schema.entries);
      for (const key of keys) {
        fieldsPrompt += `- ${key}\n`;
      }
    } else {
      fieldsPrompt = "- Данные (текст)\n";
    }

    return `Для выполнения команды "${uc.description}" отправьте сообщение следующего формата:\n\`\`\`\n/${this.name}/${uc.arName}/${uc.commandName}\n${fieldsPrompt}\`\`\`\n`;
  }

  private async executeUseCase(
    commandName: string,
    payload: string[],
  ): Promise<string> {
    const uc = this.getDocTypes().find((u) => u.commandName === commandName);
    if (!uc) {
      return `Ошибка: Команда '${commandName}' не найдена.`;
    }

    try {
      const attrs: Record<string, unknown> = {};
      const schema = uc.inputSchema as v.BaseSchema<
        unknown,
        unknown,
        v.BaseIssue<unknown>
      >;

      if (schema && typeof schema === "object" && "entries" in schema) {
        // @ts-expect-error: схему будет валидной
        const keys = Object.keys(schema.entries);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i] as string;
          if (payload[i] !== undefined) {
            attrs[key] = payload[i];
          }
        }
      } else {
        attrs._rawPayload = payload;
      }

      const actorId = "system-ui"; // Заглушка, в будущем получать из Session

      const result = await this.resolver.apiModule.handle({
        name: commandName,
        attrs,
        actorId,
      });

      return `**Успех!**\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
    } catch (err) {
      return `**Ошибка выполнения:** ${(err as Error).message || String(err)}`;
    }
  }

  /**
   * Возвращает типы команд из привязанного доменного модуля
   */
  private getDocTypes(): UcDocType[] {
    return this.resolver.apiModule.getDocTypes();
  }
}
