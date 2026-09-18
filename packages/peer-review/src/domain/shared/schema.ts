import * as v from 'valibot';

/** UUID-поле: метка попадает в сообщение об ошибке валидации. */
export const uuidField = (label: string) => v.pipe(v.string(), v.uuid(label));

/** Поле даты-времени с точностью до минуты (формат isoNow). */
export const isoMinuteField = (label: string) =>
  v.pipe(v.string(), v.isoDateTime(label));
