import { APP_CODES } from '../../shared/app-codes';

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
    mainMenu: APP_CODES.mainMenu,
  },
  stream: {
    /** Экран потока: обработчик в view-stream стори streams-контроллера */
    view: (streamId: string) => `stream:view-stream:view:${streamId}`,
    /** Запись на поток: обработчик в view-stream стори streams-контроллера */
    enroll: (streamId: string) => `stream:view-stream:enroll:${streamId}`,
    /** Самовыход из invite-проактива: обработчик в inactivity стори (FR-4) */
    inactivityDrop: (studentId: string) =>
      `stream:inactivity:drop-student:${studentId}`,
    /** Снятие с учёбы из invite-проактива: inactivity стори (FR-5) */
    inactivityMarkAbandoned: (studentId: string) =>
      `stream:inactivity:mark-abandoned:${studentId}`,
  },
  course: {
    /** Запись на модуль: обработчик в course-catalog стори courses-контроллера */
    wishModule: (moduleId: string) => `course:course-catalog:wish:${moduleId}`,
    /** Отмена course-желания (W05): обработчик в course-catalog стори */
    cancelWishCourse: (courseId: string) =>
      `course:course-catalog:cancel:${courseId}`,
    /** Отмена module-желания (W05-M): обработчик в course-catalog стори */
    cancelWishModule: (moduleId: string) =>
      `course:course-catalog:cancel-mod:${moduleId}`,
  },
  questionnaire: {
    /** Продолжить анкету по курсу: обработчик в fill-стори questionnaire-контроллера */
    resume: (courseId: string) => `questionnaire:fill:resume:${courseId}`,
    /** Подтверждение прерывания анкеты (S07/S09 → S05a, кнопка «Прервать») */
    fillCancel: (questionnaireId: string) =>
      `questionnaire:fill:cancel:${questionnaireId}`,
    /** Кнопки приглашения S01 (invite-канал, полные коды) */
    inviteStart: (questionnaireId: string) =>
      `questionnaire:invite:start:${questionnaireId}`,
    inviteWhy: (questionnaireId: string) =>
      `questionnaire:invite:why:${questionnaireId}`,
    inviteDecline: (questionnaireId: string) =>
      `questionnaire:invite:decline:${questionnaireId}`,
  },
  peerReview: {
    /** Кнопка приглашения S01 (invite-канал, полный код) → S03 кампании */
    campaignList: (campaignId: string) =>
      `peer-review:campaign:list:${campaignId}`,
  },
} as const;
