import * as v from "valibot";

/**
 * Дни занятий для базового потока.
 */
export enum BaseDays {
	/** Понедельник, среда, пятница */
	MON_WED_FRI = "MON_WED_FRI",
	/** Вторник, четверг */
	TUE_THU = "TUE_THU",
	/** Выходные */
	WEEKEND = "WEEKEND",
}

/** Схема валидации дней занятий */
export const BaseDaysSchema = v.picklist(
	Object.values(BaseDays),
	"Недопустимые дни занятий",
);
