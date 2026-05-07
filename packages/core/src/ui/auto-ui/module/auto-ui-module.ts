import type * as v from "valibot";
import type { Module } from "#api/module/module";
import type { UcDocType } from "#api/uc/use-case";
import type { ModuleMeta } from "#domain/module/types";
import type { UIAppResolver } from "#ui/ui-base/ui-app";
import { UIModule, type UIModuleResolver } from "#ui/ui-base/ui-module";
import type { UIIntent } from "../parser/command-parser";

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
  async handleIntent(intent: UIIntent, actorId: string | null = null): Promise<string> {
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
        return this.executeUseCase(ucName, intent.payload, actorId);
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
    const fieldDetails: string[] = [];
    const schema = uc.inputSchema as v.BaseSchema<
      unknown,
      unknown,
      v.BaseIssue<unknown>
    >;

    if (schema && typeof schema === "object" && "entries" in schema) {
      const entries = schema.entries as Record<
        string,
        v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>
      >;
      const keys = Object.keys(entries);

      for (const key of keys) {
        fieldsPrompt += `- ${key}\n`;
        const entry = entries[key] as v.BaseSchema<
          unknown,
          unknown,
          v.BaseIssue<unknown>
        > &
          Record<string, unknown>;
        fieldDetails.push(this.describeField(key, entry));
      }
    } else {
      fieldsPrompt = "- Данные (текст)\n";
    }

    let result = `Для выполнения команды "${uc.description}" отправьте сообщение следующего формата:\n\`\`\`\n/${this.name}/${uc.arName}/${uc.commandName}\n${fieldsPrompt}\`\`\`\n`;

    if (fieldDetails.length > 0) {
      result += `\n**Параметры:**\n${fieldDetails.join("\n")}\n`;
    }

    return result;
  }

  /**
   * Проверяет, является ли схема массивом (с учётом обёрток optional/nullable).
   */
  private isArraySchema(
    schema: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> &
      Record<string, unknown>,
  ): boolean {
    let current = schema;
    while (current) {
      const type = current.type as string | undefined;
      if (type === "optional" || type === "nullable") {
        current = current.wrapped as typeof current;
        continue;
      }
      return type === "array";
    }
    return false;
  }

  /**
   * Приводит строковое значение CLI к типу, ожидаемому Valibot-схемой.
   */
  private coerceValue(
    value: string,
    schema: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> & Record<string, unknown>,
  ): unknown {
    let current = schema;

    // Раскрываем optional/nullable
    while (current) {
      const type = current.type as string | undefined;
      if (type === "optional" || type === "nullable") {
        current = current.wrapped as typeof current;
        continue;
      }
      break;
    }

    const type = current.type as string | undefined;

    switch (type) {
      case "number":
        return Number(value);
      case "boolean":
        return value.toLowerCase() === "true";
      case "string":
      case "picklist":
      case "enum":
        return value;
      default:
        return value;
    }
  }

  /**
   * Извлекает схему элемента из схемы массива (с учётом обёрток).
   */
  private getArrayItemSchema(
    schema: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> & Record<string, unknown>,
  ): v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> & Record<string, unknown> {
    let current = schema;
    while (current) {
      const type = current.type as string | undefined;
      if (type === "optional" || type === "nullable") {
        current = current.wrapped as typeof current;
        continue;
      }
      if (type === "array") {
        return current.item as typeof current;
      }
      break;
    }
    return {} as typeof current;
  }

  private describeField(
    name: string,
    schema: v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> &
      Record<string, unknown>,
  ): string {
    const parts: string[] = [];
    let current = schema;
    let optional = false;
    let isArray = false;

    while (current) {
      const type = current.type as string | undefined;

      if (type === "optional" || type === "nullable") {
        optional = true;
        current = current.wrapped as typeof current;
        continue;
      }

      if (type === "array") {
        isArray = true;
        current = current.item as typeof current;
        continue;
      }

      if (type === "picklist") {
        const options = current.options as ReadonlyArray<string>;
        const opts = options.map((o) => `\`${o}\``).join(", ");
        parts.push(`тип: перечисление, допустимые значения: ${opts}`);
        break;
      }

      if (type === "enum") {
        const options = current.options as ReadonlyArray<string>;
        const opts = options.map((o) => `\`${o}\``).join(", ");
        parts.push(`тип: перечисление, допустимые значения: ${opts}`);
        break;
      }

      if (type) {
        const prefix = isArray ? "массив " : "";
        const arrayHint = isArray
          ? " (через запятую, напр. \`- значение1, значение2\`)"
          : "";
        parts.push(`тип: ${prefix}\`${type}\`${arrayHint}`);
        break;
      }

      break;
    }

    if (optional) {
      parts.push("опционально");
    }

    return `- **${name}** — ${parts.join(", ")}`;
  }

  private async executeUseCase(
    commandName: string,
    payload: string[],
    actorId: string | null,
  ): Promise<string> {
    const uc = this.getDocTypes().find((u) => u.commandName === commandName);
    if (!uc) {
      return `Ошибка: Команда '${commandName}' не найдена.`;
    }

    const attrs: Record<string, unknown> = {};
    const schema = uc.inputSchema as v.BaseSchema<
      unknown,
      unknown,
      v.BaseIssue<unknown>
    >;

    if (schema && typeof schema === "object" && "entries" in schema) {
      const entries = schema.entries as Record<
        string,
        v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> &
        Record<string, unknown>
      >;
      const keys = Object.keys(entries);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i] as string;
        if (payload[i] !== undefined) {
          const entry = entries[key];
          // Для полей-массивов — разбиваем строку по запятой и коэрсим элементы
          // @ts-expect-error:
          if (this.isArraySchema(entry)) {
            const itemSchema = this.getArrayItemSchema(entry);
            // biome-ignore lint/style/noNonNullAssertion: проверены выше;
            attrs[key] = payload[i]!.split(",")
              .map((s) => s.trim())
              .filter((s) => s !== "")
              .map((s) => this.coerceValue(s, itemSchema));
          } else {
            // @ts-expect-error:
            attrs[key] = this.coerceValue(payload[i]!, entry);
          }
        }
      }
    } else {
      attrs._rawPayload = payload;
    }

    const effectiveActorId = actorId || "system-ui"; // Заглушка для неаутентифицированных

    const result = await this.resolver.apiModule.handle({
      name: commandName,
      attrs,
      actorId: effectiveActorId,
    });

    return `**Успех!**\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
  }

  /**
   * Возвращает типы команд из привязанного доменного модуля
   */
  private getDocTypes(): UcDocType[] {
    return this.resolver.apiModule.getDocTypes();
  }
}
