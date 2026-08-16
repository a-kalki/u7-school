import type { QuestionnairePool } from '@u7-scl/questionnaire/domain';

/** Пул анкеты желания — вопросы об ожиданиях от курса. */
export const wishQuestionnairePool: QuestionnairePool = {
  inviteText: 'Расскажи о своих ожиданиях от курса.',
  completionText: 'Спасибо! Твоё желание зафиксировано.',
  questions: [
    {
      type: 'text',
      question: 'Что ты хочешь получить от этого курса?',
      questionCode: 'wish-expectations',
    },
  ],
};

/** Курсы, для которых настроена анкета желания. */
const courseIdsWithQuestionnaire = new Set<string>();

/**
 * Определяет, есть ли у курса анкета желания.
 * Курсы вне набора фиксируют желание мгновенно.
 */
export function hasQuestionnaire(courseId: string): boolean {
  return courseIdsWithQuestionnaire.has(courseId);
}

/** Зарегистрировать курс с анкетой желания. */
export function registerQuestionnaireCourse(courseId: string): void {
  courseIdsWithQuestionnaire.add(courseId);
}
