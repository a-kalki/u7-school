import { Routes } from './routes';

/**
 * Готовые кнопки для кросс-контроллерной навигации.
 * Строятся на базе `Routes` — «адреса» здесь не дублируются.
 *
 * Использование:
 *   rows.push([buttons.mainMenu()]);
 *   rows.push([buttons.mainMenu('🔙 Назад')]); // кастомный текст
 */
export const buttons = {
  /**
   * Кнопка «↩️ Главное меню».
   *
   * @param text — переопределить подпись (по умолчанию «↩️ Главное меню»)
   */
  mainMenu: (text?: string) => ({
    text: text ?? '↩️ Главное меню',
    code: Routes.app.mainMenu,
  }),

  /**
   * Кнопка записи на модуль (из уведомления о завершении).
   *
   * @param moduleId — целевой модуль (следующий или тот же)
   * @param text — переопределить подпись (по умолчанию «➡️ Следующий модуль»)
   */
  wishModule: (moduleId: string, text?: string) => ({
    text: text ?? '➡️ Следующий модуль',
    code: Routes.course.wishModule(moduleId),
  }),
} as const;
