/**
 * Сущность пользователя — реэкспорт канонического типа из модуля app.
 *
 * Канонический владелец User/UserSchema/UserArMeta — @u7-scl/app
 * (специализация актора core/api). Домен user импортирует его и строит
 * поверх агрегат, политики и репозиторий.
 */
export type { User, UserArMeta } from '@u7-scl/app/domain';
export { UserSchema } from '@u7-scl/app/domain';
