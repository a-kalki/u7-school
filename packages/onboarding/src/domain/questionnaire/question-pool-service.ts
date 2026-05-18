import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as v from 'valibot';
import type { AnswerEntry } from './entity';
import type { Question } from './question';
import { QuestionSchema } from './question';

/** Сервис управления пулом вопросов анкеты */
export class QuestionPoolService {
  private readonly pool: Question[];
  private readonly index: Map<string, Question>;
  private readonly includedCodes: string[];

  /**
   * @param pool — полный пул вопросов (обязателен)
   * @param includedCodes — коды вопросов, включённых в текущую версию анкеты (обязателен)
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
    answers: AnswerEntry[],
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
        (a: AnswerEntry) => a.questionCode === condition.questionCode,
      );
      if (conditionAnswer) {
        const hasMatch = conditionAnswer.answerCodes.some((ac: string) =>
          condition.answerCodes.includes(ac),
        );
        if (hasMatch) {
          return question;
        }
      }
    }

    return null;
  }

  /** Все вопросы пула */
  getAll(): Question[] {
    return this.pool;
  }

  /** Вопрос по коду */
  getByCode(code: string): Question | undefined {
    return this.index.get(code);
  }

  /**
   * Проверяет, что все коды из переданного списка существуют в пуле.
   * Выбрасывает ошибку, если какой-либо код не найден.
   *
   * Рекомендуется вызывать при инициализации приложения / resolver,
   * чтобы гарантировать, что `includedQuestionCodes` (подмножество пула)
   * не содержит недопустимых значений.
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

    if (question.type === 'choice') {
      const answerCodes = question.answers.map((a) => a.answerCode);

      if (!question.multiple) {
        return v.picklist(
          answerCodes,
          'Выберите один из предложенных вариантов',
        );
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

    // Exhaustiveness check для TypeScript
    const qText = this.getByCode(questionCode)?.question ?? questionCode;
    throw new Error(`Неизвестный тип вопроса для "${qText}"`);
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

  /**
   * Загружает дефолтный пул вопросов из question-pool.json.
   * Используй как: `QuestionPoolService.loadDefaultPool()`,
   * затем передай результат в конструктор.
   */
  static loadDefaultPool(): Question[] {
    const path = resolve(import.meta.dirname, './question-pool.json');
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content) as Question[];
  }
}
