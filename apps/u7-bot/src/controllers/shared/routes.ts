/**
 * Канонические кросс-контроллерные маршруты бота.
 * Единственное место, где живут «чужие» адреса.
 *
 * Использование:
 * - готовая ссылка: `Routes.app.mainMenu`;
 * - параметризованная ссылка — фабрика, например:
 *     course: {
 *       wishModule: (moduleId: string) => `course:course-catalog:wish:${moduleId}`,
 *     },
 *   тогда вызов `Routes.course.wishModule(id)`.
 *
 * Внутри одного контроллера сюда ничего не кладём — там `this.cb`/`this.cbFor`.
 */
export const Routes = {
  app: {
    mainMenu: 'app:main-menu',
  },
  course: {
    /** Запись на модуль: обработчик в course-catalog стори courses-контроллера */
    wishModule: (moduleId: string) => `course:course-catalog:wish:${moduleId}`,
  },
  questionnaire: {
    /** Продолжить анкету по курсу: обработчик в fill-стори questionnaire-контроллера */
    resume: (courseId: string) => `questionnaire:fill:resume:${courseId}`,
  },
} as const;
