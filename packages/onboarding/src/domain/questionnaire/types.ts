import type { Question } from './question';

/** Ответ на действие в анкете */
export type QuestionnaireActionResponse =
  | {
      type: 'wait_next';
      currentQuestion: Question;
      selectedAnswers: string[];
      /** Кнопка «Далее», формат "next:<questionCode>" */
      nextButton?: string;
    }
  | {
      type: 'new_question';
      question: Question;
      selectedAnswers?: string[];
      /** Предыдущий вопрос (choice) — для рендеринга edit сообщения */
      previousQuestion?: Question;
      /** Ответы на предыдущий вопрос */
      previousSelectedAnswers?: string[];
    }
  | {
      type: 'completed';
      selectedAnswers?: string[];
      /** Предыдущий вопрос (choice) — для рендеринга edit сообщения */
      previousQuestion?: Question;
      /** Ответы на предыдущий вопрос */
      previousSelectedAnswers?: string[];
    };
