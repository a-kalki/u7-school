import { describe, expect, test } from 'bun:test';
import {
  decodeShortId,
  encodeShortId,
  isShortId,
  SHORT_ID_PREFIX,
  SHORT_ID_RE,
} from './short-id';

describe('short-id — encodeShortId', () => {
  test('без суффикса — маркер + hex8', () => {
    expect(encodeShortId('a1b2c3d4')).toBe('~a1b2c3d4');
  });

  test('с суффиксом — маркер + hex8 + -N', () => {
    expect(encodeShortId('a1b2c3d4', 3)).toBe('~a1b2c3d4-3');
  });

  test('суффикс 0 кодируется явно', () => {
    expect(encodeShortId('a1b2c3d4', 0)).toBe('~a1b2c3d4-0');
  });
});

describe('short-id — isShortId', () => {
  test('shortId без суффикса распознаётся', () => {
    expect(isShortId('~a1b2c3d4')).toBe(true);
  });

  test('shortId с суффиксом распознаётся (не зависит от суффикса)', () => {
    expect(isShortId('~a1b2c3d4-3')).toBe(true);
    expect(isShortId('~a1b2c3d4-0')).toBe(true);
  });

  test('hex8 без маркера — НЕ shortId', () => {
    expect(isShortId('a1b2c3d4')).toBe(false);
  });

  test('не-hex содержимое — НЕ shortId', () => {
    expect(isShortId('~xyz12345')).toBe(false);
    expect(isShortId('~stream')).toBe(false);
  });

  test('обычные сегменты callback_data — НЕ shortId', () => {
    expect(isShortId('stream')).toBe(false);
    expect(isShortId('view-stream')).toBe(false);
    expect(isShortId('main-menu')).toBe(false);
  });

  test('полный UUID — НЕ shortId', () => {
    expect(isShortId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(false);
  });
});

describe('short-id — decodeShortId', () => {
  test('без суффикса — suffix undefined', () => {
    expect(decodeShortId('~a1b2c3d4')).toEqual({
      hexKey: 'a1b2c3d4',
      suffix: undefined,
    });
  });

  test('с суффиксом — суффикс числом', () => {
    expect(decodeShortId('~a1b2c3d4-7')).toEqual({
      hexKey: 'a1b2c3d4',
      suffix: 7,
    });
  });

  test('hexKey приводится к нижнему регистру', () => {
    expect(decodeShortId('~A1B2C3D4')?.hexKey).toBe('a1b2c3d4');
  });

  test('не shortId — null', () => {
    expect(decodeShortId('a1b2c3d4')).toBeNull();
    expect(decodeShortId('stream')).toBeNull();
  });
});

describe('short-id — round-trip', () => {
  test('encode → decode сохраняет hexKey и суффикс', () => {
    const encoded = encodeShortId('a1b2c3d4', 3);
    expect(decodeShortId(encoded)).toEqual({
      hexKey: 'a1b2c3d4',
      suffix: 3,
    });
  });

  test('регекс и префикс согласованы', () => {
    expect(SHORT_ID_PREFIX).toBe('~');
    expect(SHORT_ID_RE.source).toContain('~');
  });
});
