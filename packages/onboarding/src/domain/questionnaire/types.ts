import type { Question } from './question';

/** Ответ на действие в анкете */
export type QuestionnaireActionResponse =
  | {
      type: 'wait_next';
      question: Question;
      selectedAnswers: string[];
      /** Кнопка «Далее», формат "next:<questionCode>" */
      nextButton?: string;
    }
  | {
      type: 'new_question';
      question: Question;
      selectedAnswers?: string[];
    }
  | {
      type: 'completed';
      selectedAnswers?: string[];
    };
