import * as v from 'valibot';
import type { Answer } from './entity';
import type { Question } from './question';
import { QuestionSchema } from './question';

/**
 * Движок анкеты.
 * Знает структуру вопросов-ответов, логику ветвления, валидацию.
 * Предоставляет для агрегата удобный API навигации по вопросам.
 *
 * Не знает о метриках, metricMapping и контексте анкетирования —
 * это ответственность агрегата метрик (MetricQuestionnaireAr).
 */
export class QuestionnaireEngine {
  private readonly pool: Question[];
  private readonly index: Map<string, Question>;
  private readonly includedCodes: string[];

  /**
   * @param pool — полный пул вопросов
   * @param includedCodes — коды вопросов, включённых в текущую анкету (подмножество пула)
   */
  constructor(pool: Question[], includedCodes: string[]) {
    this.pool = this.validate(pool);
    this.index = new Map(this.pool.map((q) => [q.questionCode, q]));
    this.includedCodes = includedCodes;

    this.assertAllCodesExist(this.includedCodes);
  }

  /**
   * Определяет следующий вопрос с учётом ветвления.
   * @param currentCode Код текущего вопроса (null если начало)
   * @param answers Список уже полученных ответов
   */
  getNextQuestion(
    currentCode: string | null,
    answers: Answer[],
  ): Question | null {
    let foundCurrent = currentCode === null;

    for (const code of this.includedCodes) {
      if (!foundCurrent) {
        if (code === currentCode) {
          foundCurrent = true;
        }
        continue;
      }

      const question = this.getByCode(code);
      if (!question) continue;

      const condition = question.condition;
      if (!condition) {
        return question;
      }

      const conditionAnswer = answers.find(
        (a: Answer) => a.questionCode === condition.questionCode,
      );
      if (conditionAnswer) {
        const hasMatch = condition.answerCodes.includes(
          conditionAnswer.answerCode,
        );
        if (hasMatch) {
          return question;
        }
      }
    }

    return null;
  }

  /** Все вопросы пула (снимок для сохранения в агрегате) */
  getAll(): Question[] {
    return this.pool;
  }

  /** Вопрос по коду */
  getByCode(code: string): Question | undefined {
    return this.index.get(code);
  }

  /** Текст вопроса по коду (или сам код если вопрос не найден) */
  getQuestionText(code: string): string {
    return this.index.get(code)?.question ?? code;
  }

  /** Текст ответа для choice-вопроса по кодам */
  getAnswerText(questionCode: string, answerCode: string): string {
    const q = this.index.get(questionCode);
    if (!q || q.type !== 'choice') return '';
    const codes = answerCode.split(',').filter(Boolean);
    return codes
      .map((c) => q.answers.find((a) => a.answerCode === c)?.answer ?? c)
      .join(', ');
  }

  /** Все варианты ответа для choice-вопроса */
  getChoices(questionCode: string): { code: string; text: string }[] {
    const q = this.index.get(questionCode);
    if (!q || q.type !== 'choice') return [];
    return q.answers.map((a) => ({ code: a.answerCode, text: a.answer }));
  }

  /**
   * Проверяет, что все коды из переданного списка существуют в пуле.
   */
  assertAllCodesExist(codes: string[]): void {
    for (const code of codes) {
      if (!this.index.has(code)) {
        throw new Error(
          `questionCode "${code}" из includedQuestionCodes не найден в пуле`,
        );
      }
    }
  }

  /**
   * Строит Valibot-схему валидации ответа для вопроса.
   */
  buildValidationSchema(
    questionCode: string,
  ): v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>> {
    const question = this.getByCode(questionCode);
    if (!question) {
      throw new Error(`Вопрос "${questionCode}" не найден в пуле`);
    }

    if (question.type === 'text') {
      return v.pipe(v.string(), v.nonEmpty('Ответ не может быть пустым'));
    }

    // choice
    const answerCodes = question.answers.map((a) => a.answerCode);

    if (!question.multiple) {
      return v.picklist(answerCodes, 'Выберите один из предложенных вариантов');
    }

    return v.pipe(
      v.array(v.string()),
      v.minLength(1, 'Выберите хотя бы один вариант'),
      v.check(
        (items) => items.every((item) => answerCodes.includes(item)),
        'Все выбранные значения должны быть допустимыми вариантами',
      ),
    );
  }

  /** Валидация целостности пула */
  private validate(rawItems: unknown[]): Question[] {
    const parsed = rawItems.map((item, idx) => {
      try {
        return v.parse(QuestionSchema, item);
      } catch (e) {
        const msg = e instanceof v.ValiError ? e.message : String(e);
        throw new Error(`Ошибка валидации вопроса #${idx}: ${msg}`);
      }
    });

    const codes = new Set<string>();
    for (const q of parsed) {
      if (codes.has(q.questionCode)) {
        throw new Error(`Дублирующийся questionCode: ${q.questionCode}`);
      }
      codes.add(q.questionCode);
    }

    for (const q of parsed) {
      if (q.type === 'choice') {
        const answerCodes = new Set<string>();
        for (const a of q.answers) {
          if (answerCodes.has(a.answerCode)) {
            throw new Error(
              `Дублирующийся answerCode "${a.answerCode}" в вопросе "${q.questionCode}"`,
            );
          }
          answerCodes.add(a.answerCode);
        }
      }
    }

    // Text-вопрос не должен содержать answers
    for (let i = 0; i < parsed.length; i++) {
      const q = parsed[i];
      if (q?.type === 'text') {
        const raw = rawItems[i];
        if (raw && typeof raw === 'object' && 'answers' in raw) {
          throw new Error(
            `Текстовый вопрос "${q.questionCode}" не должен содержать answers`,
          );
        }
      }
    }

    for (const q of parsed) {
      if (q.condition) {
        if (!codes.has(q.condition.questionCode)) {
          throw new Error(
            `condition в вопросе "${q.questionCode}" ссылается на несуществующий questionCode: ${q.condition.questionCode}`,
          );
        }
      }
    }

    return parsed;
  }
}
