import * as v from 'valibot';
import type { Answer } from './entity';
import type { Condition, Question } from './question';
import { QuestionSchema } from './question';

/**
 * Движок анкеты.
 * Знает структуру вопросов-ответов, логику ветвления, валидацию.
 * Предоставляет для агрегата API навигации по вопросам.
 */
export class QuestionnaireEngine {
  private readonly pool: Question[];
  private readonly index: Map<string, Question>;

  /**
   * @param pool — полный пул вопросов. Все вопросы итерируются с учётом ветвлений.
   */
  constructor(pool: Question[]) {
    this.pool = this.validate(pool);
    this.index = new Map(this.pool.map((q) => [q.questionCode, q]));
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

    for (const question of this.pool) {
      if (!foundCurrent) {
        if (question.questionCode === currentCode) {
          foundCurrent = true;
        }
        continue;
      }

      if (this.isConditionMet(question.condition, answers)) {
        return question;
      }
    }

    return null;
  }

  /**
   * Выполнено ли условие показа вопроса по уже полученным ответам.
   * Вопрос без условия показывается всегда. Условие матчится any-of:
   * multiple-ответ хранится склейкой кодов через запятую ('mon,wed'),
   * поэтому достаточно пересечения хотя бы одного кода с answerCodes.
   */
  private isConditionMet(
    condition: Condition | undefined,
    answers: Answer[],
  ): boolean {
    if (!condition) return true;
    const conditionAnswer = answers.find(
      (a: Answer) => a.questionCode === condition.questionCode,
    );
    if (!conditionAnswer) return false;
    const selectedCodes = conditionAnswer.answerCode.split(',').filter(Boolean);
    return condition.answerCodes.some((code) => selectedCodes.includes(code));
  }

  /** Вопрос по коду */
  getByCode(code: string): Question | undefined {
    return this.index.get(code);
  }

  /**
   * Прогресс вопроса: позиция (1-based) и total — по активному маршруту,
   * а не по полному пулу. Маршрут строится с начала пула применением
   * условий к уже известным ответам, поэтому total честно отражает
   * реальную ветку (напр., base — 10, intensive — 9 при пуле в 11).
   * Вопрос чужой ветки в маршрут не входит — undefined.
   */
  getProgress(
    questionCode: string,
    answers: Answer[],
  ): { index: number; total: number } | undefined {
    const route: string[] = [];
    for (const question of this.pool) {
      if (this.isConditionMet(question.condition, answers)) {
        route.push(question.questionCode);
      }
    }
    const idx = route.indexOf(questionCode);
    if (idx === -1) return undefined;
    return { index: idx + 1, total: route.length };
  }

  /** Текст вопроса по коду (или сам код если вопрос не найден) */
  getQuestionText(code: string): string {
    return this.index.get(code)?.question ?? code;
  }

  /** Текст ответа для choice-вопроса по кодам */
  getAnswerText(questionCode: string, answerCode: string): string {
    const q = this.index.get(questionCode);
    if (q?.type !== 'choice') return '';
    const codes = answerCode.split(',').filter(Boolean);
    return codes
      .map((c) => q.answers.find((a) => a.answerCode === c)?.answer ?? c)
      .join(', ');
  }

  /** Все варианты ответа для choice-вопроса */
  getChoices(questionCode: string): { code: string; text: string }[] {
    const q = this.index.get(questionCode);
    if (q?.type !== 'choice') return [];
    return q.answers.map((a) => ({ code: a.answerCode, text: a.answer }));
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

    const codeToIndex = new Map(
      parsed.map((q, idx) => [q.questionCode, idx] as const),
    );
    for (const q of parsed) {
      if (q.condition) {
        if (!codeToIndex.has(q.condition.questionCode)) {
          throw new Error(
            `condition в вопросе "${q.questionCode}" ссылается на несуществующий questionCode: ${q.condition.questionCode}`,
          );
        }
        // Инвариант «условие только назад»: условие обязано ссылаться на вопрос,
        // стоящий раньше по пулу. Это гарантирует разрешимость условия
        // на момент показа вопроса (ответ на источник условия уже получен).
        const targetIdx = codeToIndex.get(q.condition.questionCode);
        const ownIdx = codeToIndex.get(q.questionCode);
        if (
          targetIdx !== undefined &&
          ownIdx !== undefined &&
          targetIdx >= ownIdx
        ) {
          throw new Error(
            `condition в вопросе "${q.questionCode}" ссылается на вопрос, стоящий позже в пуле: ${q.condition.questionCode}`,
          );
        }
      }
    }

    return parsed;
  }
}
