import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { LogLevel } from '@u7-scl/core/shared';
import { FileLogger } from './file-logger';

describe('FileLogger', () => {
  const tmpLogFile = path.resolve('/tmp', `test-bot-${Date.now()}.log`);

  test('создаёт файл и очищает его при создании', () => {
    const logger = new FileLogger(tmpLogFile);
    expect(existsSync(tmpLogFile)).toBe(true);
    expect(readFileSync(tmpLogFile, 'utf-8')).toBe('');

    logger.info('test-source', 'Hello log world', { foo: 'bar' });
    const content = readFileSync(tmpLogFile, 'utf-8');
    expect(content).toContain('[INFO] [test-source] Hello log world');
    expect(content).toContain('"foo":"bar"');

    // Очистка
    rmSync(tmpLogFile, { force: true });
  });

  test('учитывает LogLevel и фильтрует сообщения ниже порога', () => {
    const logger = new FileLogger(tmpLogFile);
    logger.setLogLevel(LogLevel.WARN);

    logger.info('src', 'Info message');
    logger.debug('src', 'Debug message');
    logger.warn('src', 'Warn message');

    const content = readFileSync(tmpLogFile, 'utf-8');
    expect(content).not.toContain('Info message');
    expect(content).not.toContain('Debug message');
    expect(content).toContain('Warn message');

    rmSync(tmpLogFile, { force: true });
  });
});
