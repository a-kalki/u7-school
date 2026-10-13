import { describe, expect, test } from 'bun:test';
import { DevPersonaSwitch } from '../../scripts/dev-persona';
import { CORE_EDUCATION_WORLD } from './core-education';
import { extractDevPersonasFromWorld } from './dev-persona-loader';

describe('extractDevPersonasFromWorld', () => {
  test('извлекает персон dev-режима из мира: dev, ментор №2 и студенты', () => {
    const personas = extractDevPersonasFromWorld(CORE_EDUCATION_WORLD);
    expect(personas.length).toBeGreaterThanOrEqual(4);

    const keys = personas.map((p) => p.key);
    expect(keys).toContain('dev');
    expect(keys).toContain('mentor2');
    expect(keys).toContain('andrey');
    expect(keys).toContain('marina');
    expect(keys).toContain('oleg');

    const dev = personas.find((p) => p.key === 'dev');
    expect(dev?.telegramId).toBe(1004);

    const mentor2 = personas.find((p) => p.key === 'mentor2');
    expect(mentor2?.telegramId).toBe(1009);

    const andrey = personas.find((p) => p.key === 'andrey');
    expect(andrey?.telegramId).toBe(1003);
  });

  test('DevPersonaSwitch поддерживает персоны из мира и переключение между ними', () => {
    const personas = extractDevPersonasFromWorld(CORE_EDUCATION_WORLD);
    const sw = new DevPersonaSwitch(999_111, personas);

    // Персона по умолчанию — dev
    expect(sw.current.key).toBe('dev');

    // Переключение на ментора №2
    const replyMentor = sw.handleCommand('/persona mentor2');
    expect(replyMentor).toContain('Виктор');
    expect(sw.current.telegramId).toBe(1009);

    // Переключение на студента
    const replyStudent = sw.handleCommand('/persona andrey');
    expect(replyStudent).toContain('Андрей');
    expect(sw.current.telegramId).toBe(1003);
  });
});
