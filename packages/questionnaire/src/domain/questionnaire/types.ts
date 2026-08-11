import type { Question } from './question';

/** Ответ на действие в анкете */
export type WaitNextResponse = {
  type: 'wait_next';
  currentQuestion: Question;
  selectedAnswers: string[];
  nextButton?: string;
};

export type NewQuestionResponse = {
  type: 'new_question';
  question: Question;
  selectedAnswers?: string[];
  previousQuestion?: Question;
  previousSelectedAnswers?: string[];
};

export type CompletedResponse = {
  type: 'completed';
  selectedAnswers?: string[];
  previousQuestion?: Question;
  previousSelectedAnswers?: string[];
};

export type QuestionnaireActionResponse =
  | WaitNextResponse
  | NewQuestionResponse
  | CompletedResponse;
