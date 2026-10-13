import type { WorldDefinition } from './types';

export interface DevPersona {
  /** Ключ команды: /persona andrey */
  key: string;
  /** Имя в фикстурном мире */
  name: string;
  /** Роль в мире — для списка и лога */
  about: string;
  /** Фикстурный telegramId */
  telegramId: number;
}

/**
 * Извлекает список dev-персон из определения мира.
 * Порядок: dev (ментор) первым, затем ментор №2, затем студенты.
 */
export function extractDevPersonasFromWorld(
  def: WorldDefinition,
): DevPersona[] {
  const persons = def.persons ?? [];
  const result: DevPersona[] = [];

  // 1. Dev (основной ментор)
  const devPerson = persons.find((p) => p.key === 'dev');
  if (devPerson) {
    result.push({
      key: 'dev',
      name: devPerson.name,
      about: 'ментор Потока 2 и автор курсов',
      telegramId: devPerson.telegramId,
    });
  }

  // 2. Ментор №2 (mentor2)
  const mentor2Person = persons.find((p) => p.key === 'mentor2');
  if (mentor2Person) {
    result.push({
      key: 'mentor2',
      name: mentor2Person.name,
      about: 'ментор Потока 1 (выпускной поток)',
      telegramId: mentor2Person.telegramId,
    });
  }

  // 3. Студенты (Андрей, Марина, Олег и выпускники)
  for (const p of persons) {
    if (p.key === 'dev' || p.key === 'mentor2') continue;
    // Проверяем, является ли персона студентом
    const studentEntry = def.students?.find((s) => s.personKey === p.key);
    if (!studentEntry) continue;

    const stream = def.streams?.find((s) => s.key === studentEntry.streamKey);
    const streamTitle = stream?.title ?? 'потока';
    const statusText = studentEntry.status ? ` (${studentEntry.status})` : '';

    result.push({
      key: p.key,
      name: p.name,
      about: `студент ${streamTitle}${statusText}`,
      telegramId: p.telegramId,
    });
  }

  return result;
}
