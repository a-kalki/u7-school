import type { Question } from './question';

/** Анкета ещё не запущена */
export type IntentionResponse = {
  type: 'intention';
  questionnaireId: string;
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
  | IntentionResponse
  | WaitNextResponse
  | NewQuestionResponse
  | CompletedResponse;
