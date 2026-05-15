/**
 * Тип сессии Grammy для onboarding-бота.
 */
export interface BotSession {
  /** UUID текущей анкеты */
  questionnaireUuid?: string;
  /** Выбранные ответы для множественного выбора (questionCode -> answerCodes) */
  selectedAnswers?: Record<string, string[]>;
}
