import * as v from "valibot";
import { StatusSchema } from "../shared/status";
import { StepSchema } from "./step";

export const LessonSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
  title: v.pipe(v.string(), v.nonEmpty("Название урока не может быть пустым")),
  additional: v.optional(v.string()),
  status: StatusSchema,
  order: v.pipe(v.number(), v.integer(), v.minValue(0)),
  createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  updatedAt: v.optional(
    v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  ),
  estimatedMinutes: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
  steps: v.array(StepSchema),
  /** Для практических занятий */
  mentorSteps: v.optional(v.array(StepSchema)),
});

export type Lesson = v.InferOutput<typeof LessonSchema>;
