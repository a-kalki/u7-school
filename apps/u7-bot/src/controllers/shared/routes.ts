/**
 * Канонические кросс-контроллерные маршруты бота.
 * Единственное место, где живут «чужие» адреса.
 *
 * Использование:
 * - готовая ссылка: `Routes.app.mainMenu`;
 * - параметризованная ссылка — фабрика, например:
 *     course: {
 *       catalogList: (courseId: string) => `course:catalog:list:${courseId}`,
 *     },
 *   тогда вызов `Routes.course.catalogList(id)`.
 *
 * Внутри одного контроллера сюда ничего не кладём — там `this.cb`/`this.cbFor`.
 */
export const Routes = {
  app: {
    mainMenu: 'app:main-menu',
  },
} as const;
