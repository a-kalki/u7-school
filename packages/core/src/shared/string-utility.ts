const HEX_BASE = 16;
const DECIMAL_BASE = 10;
const ALPHABET_COUNT = 26;
const CODE_OF_A_LOWER = 97;
const CODE_OF_A_UPPER = 65;

const random = (max: number): number => Math.floor(Math.random() * max);

const randomGenerators: Record<string, () => string | number> = {
  h: (): string => random(HEX_BASE).toString(HEX_BASE),
  d: (): string => random(DECIMAL_BASE).toString(),
  z: (): string =>
    String.fromCharCode(random(ALPHABET_COUNT) + CODE_OF_A_LOWER),
  a: (): string => {
    const isLetter = Math.random() > 0.5;
    return isLetter
      ? String.fromCharCode(random(ALPHABET_COUNT) + CODE_OF_A_LOWER)
      : random(DECIMAL_BASE).toString();
  },
  A: (): string => {
    const isLetter = Math.random() > 0.5;
    const offset =
      isLetter && Math.random() > 0.5 ? CODE_OF_A_UPPER : CODE_OF_A_LOWER;
    return isLetter
      ? String.fromCharCode(random(ALPHABET_COUNT) + offset)
      : random(DECIMAL_BASE).toString();
  },
  Z: (): string => {
    const offset =
      Math.random() > 0.5 ? CODE_OF_A_UPPER : CODE_OF_A_LOWER;
    return String.fromCharCode(random(ALPHABET_COUNT) + offset);
  },
};

for (let i = 0; i < 10; i += 1) {
  randomGenerators[i] = (): number => random(i + 1);
}

/**
 * Утилиты для работы со строками:
 * генерация случайных строк, trim, преобразование регистров, замена шаблонов.
 */
class StringUtility {
  /**
   * Генерирует строку по формату.
   * Каждый символ формата задаёт тип значения:
   * - 'h' — hex (0-9, a-f)
   * - 'd' — десятичная цифра (0-9)
   * - 'a' — буква (a-z) или цифра (0-9)
   * - 'A' — буква (a-z, A-Z) или цифра (0-9)
   * - 'z' — буква (a-z)
   * - 'Z' — буква (a-z, A-Z)
   * - цифры (0-9) — случайное число от 0 до указанной цифры
   *
   * @param format - строка формата
   * @param delimiter - разделитель сегментов (по умолчанию '-')
   * @returns сгенерированная строка
   */
  random(format: string, delimiter = '-'): string {
    const segments = format.split(delimiter);
    return segments
      .map((segment) =>
        segment
          .split('')
          .map((char) => {
            if (!(char in randomGenerators)) {
              throw new Error(`Недопустимый символ формата: ${char}`);
            }
            return randomGenerators[char]!();
          })
          .join(''),
      )
      .join(delimiter);
  }

  /** Удаляет указанные символы с начала и конца строки */
  trim(target: string, chars: string): string {
    return this.trimStart(this.trimEnd(target, chars), chars);
  }

  /** Удаляет указанные символы с начала строки */
  trimStart(target: string, chars: string): string {
    let start = 0;
    const end = target.length;
    while (start < end && chars.includes(target[start]!)) {
      start += 1;
    }
    return target.substring(start, end);
  }

  /** Удаляет указанные символы с конца строки */
  trimEnd(target: string, chars: string): string {
    let end = target.length;
    while (end > 0 && chars.includes(target[end - 1]!)) {
      end -= 1;
    }
    return target.substring(0, end);
  }

  /** Делает первую букву заглавной */
  makeFirstLetterUppercase(str: string): string {
    return str.length > 0 ? str[0]!.toUpperCase() + str.substring(1) : str;
  }

  /** camelCase → kebab-case */
  camelCaseToKebab(text: string): string {
    return this.camelToSnakeKebabCase(text, false, '-');
  }

  /** camelCase → SUPER-KEBAB-CASE */
  camelCaseToSuperKebab(text: string): string {
    return this.camelToSnakeKebabCase(text, true, '-');
  }

  /** camelCase → snake_case */
  camelCaseToSnake(text: string): string {
    return this.camelToSnakeKebabCase(text, false, '_');
  }

  /** camelCase → SUPER_SNAKE_CASE */
  camelCaseToSuperSnake(text: string): string {
    return this.camelToSnakeKebabCase(text, true, '_');
  }

  private camelToSnakeKebabCase(
    text: string,
    isSuper: boolean,
    caseChar = '-',
  ): string {
    if (text === '') return '';
    const cb = (prev: string, curr: string): string =>
      prev +
      (StringUtility.isTitle(curr)
        ? `${caseChar}${curr.toLowerCase()}`
        : curr);
    return isSuper
      ? this.reduce(text.substring(1), cb, text[0]!.toLowerCase())
      : this.reduce(text, cb);
  }

  /** kebab-case → camelCase */
  kebabToCamelCase(text: string): string {
    return this.snakeKebabToCamelCase(text, false, '-');
  }

  /** kebab-case → SuperCamelCase */
  kebabToSuperCamelCase(text: string): string {
    return this.snakeKebabToCamelCase(text, true, '-');
  }

  /** snake_case → camelCase */
  snakeToCamelCase(text: string): string {
    return this.snakeKebabToCamelCase(text, false, '_');
  }

  /** snake_case → SuperCamelCase */
  snakeToSuperCamelCase(text: string): string {
    return this.snakeKebabToCamelCase(text, true, '_');
  }

  private snakeKebabToCamelCase(
    text: string,
    isSuper: boolean,
    char = '-',
  ): string {
    if (text === '') return '';
    const cb = (prev: string, curr: string): string =>
      prev[prev.length - 1]! === char
        ? prev.substring(0, prev.length - 1) + curr.toUpperCase()
        : prev + curr;
    return isSuper
      ? this.reduce(text.substring(1), cb, text[0]!.toUpperCase())
      : this.reduce(text, cb);
  }

  /**
   * Заменяет шаблон в строке на указанную подстроку.
   * @param brackets - пара скобок для обрамления шаблона (по умолчанию '{}')
   * @param bracketCount - количество повторений скобок (по умолчанию 2)
   */
  replaceTemplate(
    text: string,
    tmpl: string,
    replacement: string,
    brackets: [string, string] = ['{', '}'],
    bracketCount = 2,
  ): string {
    const [openBracket, closeBracket] = brackets;
    const escapedTemplate = tmpl.replace(
      /[-/\\^$*+?.()|[\]{}]/g,
      '\\$&',
    );
    const openBrackets = openBracket
      .repeat(bracketCount)
      .replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const closeBrackets = closeBracket
      .repeat(bracketCount)
      .replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regexPattern = `${openBrackets}\\s*${escapedTemplate}\\s*${closeBrackets}`;
    const regex = new RegExp(regexPattern, 'g');
    return text.replace(regex, (match) => {
      const withoutSpaces = match.replace(/\s+/g, '');
      const finalPattern = new RegExp(
        `${openBrackets}${escapedTemplate}${closeBrackets}`,
      );
      return withoutSpaces.replace(finalPattern, replacement);
    });
  }

  /** Применяет редуктор к каждому символу строки */
  reduce<T>(
    text: string,
    cb: (prev: T, char: string) => T,
    initial?: T,
  ): T {
    let result: T;
    let startIndex: number;
    if (initial !== undefined) {
      result = initial;
      startIndex = 0;
    } else if (text.length > 0) {
      result = text[0] as unknown as T;
      startIndex = 1;
    } else {
      result = '' as unknown as T;
      startIndex = 0;
    }
    for (let i = startIndex; i < text.length; i++) {
      result = cb(result, text[i]!);
    }
    return result;
  }

  private static isTitle(char: string): boolean {
    return char >= 'A' && char <= 'Z';
  }
}

export const stringUtility = Object.freeze(new StringUtility());
