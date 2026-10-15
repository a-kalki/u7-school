import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import {
  createSchool,
  SchoolSchema,
  U7_SCHOOL_ID,
  U7_SCHOOL_STATIC,
} from './school';

describe('SchoolSchema и сущность School', () => {
  const validSchoolData = {
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
    communityGroup: {
      id: -100123456789,
      url: 'https://t.me/+communityInvite',
    },
    studentGroup: {
      id: -100987654321,
      inviteUrl: 'https://t.me/+studentInvite',
    },
  };

  test('успешно валидирует корректный объект школы без site', () => {
    const parsed = v.parse(SchoolSchema, validSchoolData);
    expect(parsed).toEqual(validSchoolData);
    expect(parsed.contacts.site).toBeUndefined();
  });

  test('успешно валидирует корректный объект школы с опциональным site', () => {
    const withSite = {
      ...validSchoolData,
      contacts: {
        ...validSchoolData.contacts,
        site: 'https://u7school.kz',
      },
    };
    const parsed = v.parse(SchoolSchema, withSite);
    expect(parsed.contacts.site).toBe('https://u7school.kz');
  });

  test('выбрасывает ошибку при отсутствии обязательного поля (id)', () => {
    const { id: _, ...missingId } = validSchoolData;
    expect(() => v.parse(SchoolSchema, missingId)).toThrow();
  });

  test('выбрасывает ошибку при отсутствии обязательного поля (communityGroup)', () => {
    const { communityGroup: _, ...missingCommunity } = validSchoolData;
    expect(() => v.parse(SchoolSchema, missingCommunity)).toThrow();
  });

  test('выбрасывает ошибку при отсутствии обязательного поля (studentGroup)', () => {
    const { studentGroup: _, ...missingStudent } = validSchoolData;
    expect(() => v.parse(SchoolSchema, missingStudent)).toThrow();
  });

  test('выбрасывает ошибку при невалидном UUID id', () => {
    const invalidId = { ...validSchoolData, id: 'not-a-uuid' };
    expect(() => v.parse(SchoolSchema, invalidId)).toThrow();
  });

  test('U7_SCHOOL_STATIC содержит ожидаемые статические константы', () => {
    expect(U7_SCHOOL_STATIC.id).toBe(U7_SCHOOL_ID);
    expect(U7_SCHOOL_STATIC.name).toBe('U7 School');
    expect(U7_SCHOOL_STATIC.contacts.phone).toBe('+7 777 287 8182');
    expect(U7_SCHOOL_STATIC.mentors).toContain(
      '8d9a56f6-51e7-49f0-ba58-2832b157e718',
    );
  });

  test('createSchool собирает валидный объект School из статики и переданных групп', () => {
    const school = createSchool({
      communityGroup: {
        id: -100123456789,
        url: 'https://t.me/+communityInvite',
      },
      studentGroup: {
        id: -100987654321,
        inviteUrl: 'https://t.me/+studentInvite',
      },
    });

    const parsed = v.parse(SchoolSchema, school);
    expect(parsed.id).toBe(U7_SCHOOL_ID);
    expect(parsed.name).toBe('U7 School');
    expect(parsed.communityGroup.id).toBe(-100123456789);
    expect(parsed.studentGroup.id).toBe(-100987654321);
    expect(parsed.mentors).toEqual([...U7_SCHOOL_STATIC.mentors]);
  });

  test('createSchool позволяет переопределить список менторов школы', () => {
    const customMentor = '44444444-4444-4444-4444-444444444444';
    const school = createSchool({
      communityGroup: {
        id: -100123456789,
        url: 'https://t.me/+communityInvite',
      },
      studentGroup: {
        id: -100987654321,
        inviteUrl: 'https://t.me/+studentInvite',
      },
      mentors: [customMentor],
    });

    expect(school.mentors).toEqual([customMentor]);
  });
});
