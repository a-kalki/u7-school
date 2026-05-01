import * as v from "valibot";
import { StatusSchema } from "../shared/status";
import { ProjectSchema } from "../project/project";

export const ModuleSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
  title: v.pipe(v.string(), v.nonEmpty("Название модуля не может быть пустым")),
  goal: v.optional(v.string()),
  result: v.optional(v.string()),
  additional: v.optional(v.string()),
  status: StatusSchema,
  order: v.pipe(v.number(), v.integer(), v.minValue(0)),
  createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
  updatedAt: v.optional(v.pipe(v.string(), v.isoDateTime("Некорректный формат даты"))),
  projects: v.array(ProjectSchema),
});

export type Module = v.InferOutput<typeof ModuleSchema>;
