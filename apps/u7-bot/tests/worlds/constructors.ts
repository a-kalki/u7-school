import type {
  CampaignDef,
  CourseDef,
  PersonDef,
  ReviewDef,
  StreamDef,
  StudentDef,
} from './types';

/**
 * Конструктор персоны.
 */
export function person(def: PersonDef): PersonDef {
  return def;
}

/**
 * Конструктор курса со структурой модулей, проектов и уроков.
 */
export function course(def: CourseDef): CourseDef {
  return def;
}

/**
 * Конструктор потока.
 */
export function stream(def: StreamDef): StreamDef {
  return def;
}

/**
 * Конструктор студента.
 */
export function student(def: StudentDef): StudentDef {
  return def;
}

/**
 * Конструктор кампании отзывов.
 */
export function campaign(def: CampaignDef): CampaignDef {
  return def;
}

/**
 * Конструктор отзыва.
 */
export function review(def: ReviewDef): ReviewDef {
  return def;
}
