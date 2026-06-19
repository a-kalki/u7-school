import type { User } from '@u7-scl/app/domain';
import type { AppOnlyApiModuleMeta } from './stories/community.story';
import { CommunityStory } from './stories/community.story';
import { U7BotController } from './u7-bot-controller';

/**
 * Контроллер уровня приложения для stories без привязки к доменным модулям.
 * Например: кнопка «Сообщество школы», /help и т.д.
 */
export class AppController extends U7BotController<AppOnlyApiModuleMeta> {
  readonly name = 'app';

  /**
   * @param schoolGroupUrl — URL группы школы (если не задан, кнопка «Сообщество школы» не добавляется)
   */
  constructor(schoolGroupUrl?: string) {
    // Передаём заглушку ApiModule — контроллер не делает вызовов usecase
    super({} as never);
    if (schoolGroupUrl) {
      this.stories.push(new CommunityStory(schoolGroupUrl));
    }
  }

  override async handleHelpStart(_actor: User): Promise<string | null> {
    return '💬 Сообщество школы — ссылка на Telegram-группу школы';
  }
}
