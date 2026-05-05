import type { Module } from "../../api/module/module";
import type { UcDocType } from "../../api/uc/use-case";
import type { ModuleMeta } from "../../domain/module/types";
import type { UIAppResolver } from "../ui-base/ui-app";
import { UIModule, type UIModuleResolver } from "../ui-base/ui-module";
import type { UIIntent } from "./command-parser";

export interface AutoUiModuleResolver extends UIModuleResolver {
  apiModule: Module<ModuleMeta, unknown>;
}

export abstract class AutoUiModule<
  TMeta extends ModuleMeta,
  AR extends UIAppResolver,
  MR extends AutoUiModuleResolver,
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
      aggregates.add(uc.aggregateName);
      aggregateLabels.set(uc.aggregateName, uc.aggregateLabel);
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
      (uc) => uc.aggregateName === aggregateName,
    );

    if (useCases.length === 0) {
      return `Ошибка: Объект '${aggregateName}' не найден.\nНазад: /${this.name}/aggregates`;
    }

    // biome-ignore lint/style/noNonNullAssertion: проверены выше;
    const label = useCases[0]!.aggregateLabel;
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

    // В будущем здесь будет reflection через Valibot для получения схемы
    // Пока возвращаем заглушку-шаблон
    return `Для выполнения команды "${uc.description}" отправьте сообщение следующего формата:\n\`\`\`\n/${this.name}/${uc.aggregateName}/${uc.commandName}\n- Поле 1\n- Поле 2\n\`\`\`\n`;
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
      // Пока заглушка для маппинга (в будущем нужна рефлексия Valibot для перевода payload массива в объект)
      const attrs = { _rawPayload: payload };
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
