import type { Question } from './question';

export type WaitNextResponse = {
  type: 'wait_next';
  currentQuestion: Question;
  selectedAnswers: string[];
  /** Кнопка «Далее», формат "next:<questionCode>" */
  nextButton?: string;
};

export type NewQuestionResponse = {
  type: 'new_question';
  question: Question;
  selectedAnswers?: string[];
  /** Предыдущий вопрос (choice) — для рендеринга edit сообщения */
  previousQuestion?: Question;
  /** Ответы на предыдущий вопрос */
  previousSelectedAnswers?: string[];
};

export type CompletedResponse = {
  type: 'completed';
  selectedAnswers?: string[];
  /** Предыдущий вопрос (choice) — для рендеринга edit сообщения */
  previousQuestion?: Question;
  /** Ответы на предыдущий вопрос */
  previousSelectedAnswers?: string[];
};
/** Ответ на действие в анкете */
export type QuestionnaireActionResponse =
  | WaitNextResponse
  | NewQuestionResponse
  | CompletedResponse;
