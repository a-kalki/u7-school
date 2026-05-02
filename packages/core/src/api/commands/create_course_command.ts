import * as v from "valibot";

/** Схема валидации команды создания курса */
export const CreateCourseCommandSchema = v.object({
	title: v.pipe(v.string(), v.nonEmpty("Название курса не может быть пустым")),
	description: v.pipe(v.string(), v.nonEmpty("Описание курса не может быть пустым")),
	authorId: v.pipe(v.string(), v.uuid("Некорректный формат UUID автора")),
});

/** Команда создания курса */
export type CreateCourseCommand = v.InferOutput<typeof CreateCourseCommandSchema>;
