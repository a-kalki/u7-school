import type { Course, Lesson, Module, Step } from '@u7-scl/course/domain';
import type {
  Review,
  ReviewCampaign,
  ReviewDirection,
  StudentOutcome,
} from '@u7-scl/peer-review/domain';
import type { Questionnaire } from '@u7-scl/questionnaire/domain';
import type { Stream, StreamStatus, Student } from '@u7-scl/stream/domain';
import type { Role, User } from '@u7-scl/user/domain';
import type { Wish } from '@u7-scl/wish/domain';

/**
 * WorldState — центральный объект состояния мира.
 * Коллекции state-объектов агрегатов, нейтральные к хранилищу (plain-данные).
 */
export interface WorldState {
  users: User[];
  streams: Stream[];
  students: Student[];
  courses: Course[];
  modules: Module[];
  lessons: Lesson[];
  steps: Step[];
  campaigns: ReviewCampaign[];
  reviews: Review[];
  wishes: Wish[];
  questionnaires: Questionnaire[];
  sessions: unknown[];
  shortIds: unknown[];
}

/** Персона dev-режима (для реестра /persona). */
export interface DevPersonaInfo {
  key: string;
  name: string;
  about: string;
  telegramId: number;
}

/** Декларативное описание персоны */
export interface PersonDef {
  key: string;
  uuid?: string;
  name: string;
  telegramId: number;
  roles: (Role | `${Role}`)[];
  registeredAt?: string;
  nick?: string;
  about?: string;
}

/** Декларативное описание шага */
export interface StepDef {
  key: string;
  uuid?: string;
  title?: string;
  description?: string;
  content?: string;
  theoryUrl?: string;
  code?: string;
  kind?: 'text' | 'code' | 'file';
}

/** Декларативное описание урока */
export interface LessonDef {
  key: string;
  uuid?: string;
  title: string;
  steps?: StepDef[];
}

/** Декларативное описание проекта */
export interface ProjectDef {
  key: string;
  uuid?: string;
  title: string;
  lessons?: LessonDef[];
}

/** Декларативное описание модуля */
export interface ModuleDef {
  key: string;
  uuid?: string;
  title: string;
  description?: string;
  projects?: ProjectDef[];
}

/** Декларативное описание курса */
export interface CourseDef {
  key: string;
  uuid?: string;
  title: string;
  description: string;
  authorKey: string;
  modules?: ModuleDef[];
}

/** Декларативное описание потока */
export interface StreamDef {
  key: string;
  uuid?: string;
  title: string;
  description: string;
  courseKey: string;
  moduleKey?: string;
  mentorKey: string;
  status: StreamStatus | `${StreamStatus}`;
  startedAt?: string;
  telegramGroupId?: string;
  telegramGroupInvite?: string;
  goal?: string;
  result?: string;
}

/** Запись о прохождении шага студентом */
export interface StudentStepDef {
  stepKey?: string;
  stepId?: string;
  status: 'issued' | 'completed';
  issuedAt?: string;
  completedAt?: string;
}

/** Декларативное описание студента */
export interface StudentDef {
  key: string;
  uuid?: string;
  personKey: string;
  streamKey: string;
  enrolledAt: string;
  status: 'enrolled' | 'active' | 'abandoned' | 'advanced' | 'not_advanced';
  currentStepKey?: string;
  currentStepId?: string;
  steps?: StudentStepDef[];
}

/** Декларативное описание кампании отзывов */
export interface CampaignDef {
  key: string;
  uuid?: string;
  context: 'stream_fate';
  streamKey: string;
  subjectPersonKey: string;
  mentorPersonKey: string;
  subjectOutcome: StudentOutcome;
  createdAt: string;
  expiresAt: string;
  participants?: string[];
}

/** Декларативное описание отзыва */
export interface ReviewDef {
  key: string;
  uuid?: string;
  campaignKey: string;
  authorPersonKey: string;
  recipientPersonKey: string;
  direction: ReviewDirection;
  authorOutcome?: StudentOutcome;
  text: string;
  createdAt?: string;
}

/** Манифест материализованного мира */
export interface WorldManifest {
  name: string;
  hash: string;
  generatedAt: string;
  sourceHash?: string;
}

/** Полная декларация тестового мира */
export interface WorldDefinition {
  name?: string;
  description?: string;
  anchorDate?: Date;
  persons?: PersonDef[];
  courses?: CourseDef[];
  streams?: StreamDef[];
  students?: StudentDef[];
  campaigns?: CampaignDef[];
  reviews?: ReviewDef[];
  wishes?: Wish[];
  questionnaires?: Questionnaire[];
}
