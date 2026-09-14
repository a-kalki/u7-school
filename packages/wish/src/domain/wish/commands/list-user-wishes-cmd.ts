import * as v from 'valibot';
import type { Wish, WishArMeta } from '../entity';

/** Схема запроса списка желаний пользователя (батч для каталога курсов). */
export const ListUserWishesCmdSchema = v.object({});

/** Запрос списка желаний пользователя. */
export type ListUserWishesCmd = v.InferOutput<typeof ListUserWishesCmdSchema>;

/** Мета запроса списка желаний пользователя */
export interface ListUserWishesCmdMeta {
  ucName: 'list-user-wishes';
  arMeta: WishArMeta;
  input: ListUserWishesCmd;
  output: Wish[];
  errors: never;
  requiresAuth: true;
  type: 'query';
}
