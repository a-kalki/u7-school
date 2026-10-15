import * as v from 'valibot';

/** Идентификатор школы U7 в системе (связка со Stream.schoolId) */
export const U7_SCHOOL_ID = 'a0000000-0000-4000-8000-000000000001';

/** Статические данные школы U7 */
export const U7_SCHOOL_STATIC = {
  id: U7_SCHOOL_ID,
  name: 'U7 School',
  description:
    'Развиваем не только хард-скиллы, но и софт-скиллы, придавая последним не меньшее значение. Весь процесс обучения заточен на это.',
  address:
    'Оффлайн уроки на территории BatysHub. Адрес: г. Уральск, ул. Исатая-Махамбета, 84 (здание ЦОН по Чагано-Набережной).',
  contacts: {
    phone: '+7 777 287 8182',
  },
  mentors: ['8d9a56f6-51e7-49f0-ba58-2832b157e718'],
} as const;

/** Valibot-схема сущности школы */
export const SchoolSchema = v.object({
  id: v.pipe(v.string(), v.uuid('Некорректный формат UUID школы')),
  name: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Имя школы не может быть пустым'),
  ),
  description: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Описание школы не может быть пустым'),
  ),
  address: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Адрес школы не может быть пустым'),
  ),
  contacts: v.object({
    phone: v.pipe(
      v.string(),
      v.trim(),
      v.nonEmpty('Телефон школы не может быть пустым'),
    ),
    site: v.optional(
      v.pipe(v.string(), v.trim(), v.nonEmpty('Сайт не может быть пустым')),
    ),
  }),
  mentors: v.array(
    v.pipe(v.string(), v.uuid('Некорректный формат UUID ментора')),
  ),
  communityGroup: v.object({
    id: v.pipe(
      v.number(),
      v.integer('ID группы сообщества должен быть целым числом'),
    ),
    url: v.pipe(
      v.string(),
      v.trim(),
      v.nonEmpty('URL группы сообщества не может быть пустым'),
    ),
  }),
  studentGroup: v.object({
    id: v.pipe(
      v.number(),
      v.integer('ID студенческой группы должен быть целым числом'),
    ),
    inviteUrl: v.pipe(
      v.string(),
      v.trim(),
      v.nonEmpty('Ссылка студенческой группы не может быть пустой'),
    ),
  }),
});

/** Сущность школы платформы */
export type School = v.InferOutput<typeof SchoolSchema>;

/**
 * Фабрика сборки сущности School из статических данных и групп из окружения
 */
export function createSchool(params: {
  communityGroup: { id: number; url: string };
  studentGroup: { id: number; inviteUrl: string };
  contacts?: { site?: string };
  mentors?: string[];
}): School {
  return {
    ...U7_SCHOOL_STATIC,
    mentors: params.mentors
      ? [...params.mentors]
      : [...U7_SCHOOL_STATIC.mentors],
    contacts: {
      ...U7_SCHOOL_STATIC.contacts,
      ...(params.contacts?.site ? { site: params.contacts.site } : {}),
    },
    communityGroup: params.communityGroup,
    studentGroup: params.studentGroup,
  };
}

/**
 * Дефолтная сущность школы для тестов и фикстур
 */
export const TEST_SCHOOL: School = createSchool({
  communityGroup: {
    id: -100123456789,
    url: 'https://t.me/+communityInvite',
  },
  studentGroup: {
    id: -100987654321,
    inviteUrl: 'https://t.me/+studentInvite',
  },
  mentors: [
    '44444444-4444-4444-4444-444444444444',
    '99999999-9999-4999-8999-999999999999',
  ],
});
