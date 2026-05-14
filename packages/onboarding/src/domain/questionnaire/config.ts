import { BaseDays } from "#domain/application/base-days";
import { BaseTime } from "#domain/application/base-time";
import { Experience } from "#domain/application/experience";
import { Format } from "#domain/application/format";
import { Goals } from "#domain/application/goals";
import { IntensiveTime } from "#domain/application/intensive-time";
import { Intensity } from "#domain/application/intensity";
import { Source } from "#domain/application/source";

/** Тип вопроса анкеты */
export type QuestionType = "single_choice" | "text" | "conditional_choice";

/** Вариант ответа для вопроса с выбором */
export interface AnswerOption {
  /** Код значения (используется в БД и статистике) */
  code: string;
  /** Текст для отображения пользователю */
  label: string;
}

/** Вопрос анкеты */
export interface Question {
  /** Код поля (соответствует ключу в ApplicationAnswers) */
  field: string;
  /** Текст вопроса */
  text: string;
  /** Тип вопроса */
  type: QuestionType;
  /** Обязательный ли вопрос */
  required: boolean;
  /** Варианты ответов (для типов с выбором) */
  options?: AnswerOption[];
  /** Условие показа (например, показывать только при intensity=BASE) */
  condition?: { field: string; value: string };
}

/** Конфигурация анкеты */
export interface QuestionnaireConfig {
  /** Версия конфигурации */
  version: string;
  /** Список вопросов в порядке следования */
  questions: Question[];
}

/** Метки для источников */
const sourceOptions: AnswerOption[] = [
  { code: Source.TELEGRAM, label: "Telegram-канал" },
  { code: Source.INSTAGRAM, label: "Instagram" },
  { code: Source.FRIEND, label: "Рекомендация друга" },
  { code: Source.SEARCH, label: "Поиск в интернете" },
  { code: Source.OTHER, label: "Другое" },
];

/** Метки для уровня опыта */
const experienceOptions: AnswerOption[] = [
  { code: Experience.NONE, label: "Нет опыта программирования" },
  { code: Experience.BEGINNER, label: "Начинающий — изучал основы самостоятельно" },
  { code: Experience.INTERMEDIATE, label: "Средний — есть небольшие проекты" },
  { code: Experience.ADVANCED, label: "Продвинутый — работал в коммерческих проектах" },
];

/** Метки для формата */
const formatOptions: AnswerOption[] = [
  { code: Format.ONLINE, label: "Онлайн" },
  { code: Format.OFFLINE, label: "Офлайн" },
  { code: Format.ANY, label: "Не имеет значения" },
];

/** Метки для целей */
const goalsOptions: AnswerOption[] = [
  { code: Goals.CAREER_CHANGE, label: "Смена профессии" },
  { code: Goals.SKILL_UP, label: "Повышение квалификации" },
  { code: Goals.OWN_PROJECT, label: "Запуск собственного проекта" },
  { code: Goals.GENERAL, label: "Общее развитие и интерес" },
];

/** Метки для интенсивности */
const intensityOptions: AnswerOption[] = [
  { code: Intensity.BASE, label: "Базовый поток — 2-3 раза в неделю" },
  { code: Intensity.INTENSIVE, label: "Интенсивный поток — ежедневно" },
  { code: Intensity.UNDECIDED, label: "Пока не решил(а)" },
];

/** Метки для дней базового потока */
const baseDaysOptions: AnswerOption[] = [
  { code: BaseDays.MON_WED_FRI, label: "Понедельник, среда, пятница" },
  { code: BaseDays.TUE_THU, label: "Вторник, четверг" },
  { code: BaseDays.WEEKEND, label: "Выходные" },
];

/** Метки для времени базового потока */
const baseTimeOptions: AnswerOption[] = [
  { code: BaseTime.MORNING, label: "Утро (10:00 – 13:00)" },
  { code: BaseTime.EVENING, label: "Вечер (19:00 – 22:00)" },
];

/** Метки для времени интенсивного потока */
const intensiveTimeOptions: AnswerOption[] = [
  { code: IntensiveTime.MORNING, label: "Утро (10:00 – 13:00)" },
  { code: IntensiveTime.EVENING, label: "Вечер (19:00 – 22:00)" },
  { code: IntensiveTime.FULL_DAY, label: "Полный день (10:00 – 18:00)" },
];

/**
 * Текущая конфигурация анкеты.
 * Позволяет легко изменять вопросы и варианты ответов.
 */
export const questionnaireConfig: QuestionnaireConfig = {
  version: "1.0.0",
  questions: [
    {
      field: "source",
      text: "Откуда вы узнали о нашей школе?",
      type: "single_choice",
      required: true,
      options: sourceOptions,
    },
    {
      field: "interestReason",
      text: "Что вас заинтересовало в нашей школе?",
      type: "text",
      required: true,
    },
    {
      field: "experience",
      text: "Какой у вас опыт программирования?",
      type: "single_choice",
      required: true,
      options: experienceOptions,
    },
    {
      field: "format",
      text: "Какой формат обучения вам предпочтительнее?",
      type: "single_choice",
      required: true,
      options: formatOptions,
    },
    {
      field: "goals",
      text: "Какая ваша главная цель обучения?",
      type: "single_choice",
      required: true,
      options: goalsOptions,
    },
    {
      field: "intensity",
      text: "Какая интенсивность обучения вам подходит?",
      type: "single_choice",
      required: true,
      options: intensityOptions,
    },
    {
      field: "baseDays",
      text: "Какие дни вам удобны для занятий?",
      type: "conditional_choice",
      required: false,
      options: baseDaysOptions,
      condition: { field: "intensity", value: Intensity.BASE },
    },
    {
      field: "baseTime",
      text: "Какое время вам удобно для занятий?",
      type: "conditional_choice",
      required: false,
      options: baseTimeOptions,
      condition: { field: "intensity", value: Intensity.BASE },
    },
    {
      field: "intensiveTime",
      text: "Какое время вам удобно для занятий?",
      type: "conditional_choice",
      required: false,
      options: intensiveTimeOptions,
      condition: { field: "intensity", value: Intensity.INTENSIVE },
    },
  ],
};
