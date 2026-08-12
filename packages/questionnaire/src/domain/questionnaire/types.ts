import type { Question } from './question';

/** Приглашение пройти анкету (статус invited) */
export type InviteResponse = {
  type: 'invited';
  questionnaireId: string;
  inviteText?: string;
  whyText?: string;
};

/** Ожидание выбора (multiple choice, черновики) */
export type WaitNextResponse = {
  type: 'wait_next';
  currentQuestion: Question;
  selectedAnswers: string[];
  nextButton?: string;
};

/** Новый вопрос */
export type NewQuestionResponse = {
  type: 'new_question';
  question: Question;
  selectedAnswers?: string[];
  previousQuestion?: Question;
  previousSelectedAnswers?: string[];
};

/** Анкета завершена */
export type CompletedResponse = {
  type: 'completed';
  selectedAnswers?: string[];
  previousQuestion?: Question;
  previousSelectedAnswers?: string[];
};

export type QuestionnaireActionResponse =
  | InviteResponse
  | WaitNextResponse
  | NewQuestionResponse
  | CompletedResponse;
