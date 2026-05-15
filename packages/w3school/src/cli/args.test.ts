import { describe, expect, test } from 'bun:test';
import { parseArgs } from './args';

describe('CLI Argument Parsing', () => {
  test("should identify 'status' command", () => {
    const args = ['status'];
    const parsed = parseArgs(args);
    expect(parsed.command).toBe('status');
  });

  test("should identify 'parse' command", () => {
    const args = ['parse'];
    const parsed = parseArgs(args);
    expect(parsed.command).toBe('parse');
  });

  test("should identify 'enrich' command", () => {
    const args = ['enrich'];
    const parsed = parseArgs(args);
    expect(parsed.command).toBe('enrich');
  });

  test('should return help for unknown command', () => {
    const args = ['unknown'];
    const parsed = parseArgs(args);
    expect(parsed.command).toBe('help');
  });

  test('should return help if no command provided', () => {
    const args: string[] = [];
    const parsed = parseArgs(args);
    expect(parsed.command).toBe('help');
  });
});
