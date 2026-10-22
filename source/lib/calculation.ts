export type ArcanaCode = number;

export type NameCode = {
  field: 'Фамилия' | 'Имя' | 'Отчество';
  rawTotal: number;
  code: ArcanaCode | null;
  arcana: string | null;
  unsupportedLetters: string[];
};

export type PortraitPosition = {
  number: number;
  label: string;
  code: number;
  arcana: string | null;
};

export type PortraitCalculation = {
  version: 1;
  positions: PortraitPosition[];
  nameCodes: NameCode[];
  lifePath: number;
  ageBoundary: number;
};

export type PortraitPersonFields = {
  firstName: string;
  middleName: string;
  lastName: string;
};

export const ARCANA_NAMES: Record<number, string> = {
  1: 'Маг',
  2: 'Верховная Жрица',
  3: 'Императрица',
  4: 'Император',
  5: 'Верховный Жрец',
  6: 'Влюблённые',
  7: 'Колесница',
  8: 'Справедливость',
  9: 'Отшельник',
  10: 'Колесо Фортуны',
  11: 'Сила',
  12: 'Повешенный',
  13: 'Смерть',
  14: 'Умеренность',
  15: 'Дьявол',
  16: 'Башня',
  17: 'Звезда',
  18: 'Луна',
  19: 'Солнце',
  20: 'Суд',
  21: 'Мир',
  22: 'Шут',
};

const POSITION_LABELS: Record<number, string> = {
  1: 'Детство и юность',
  2: 'Зрелый возраст',
  3: 'Поздний период жизни',
  4: 'Подсознание',
  5: 'Сознание',
  6: 'Сверхсознание',
  7: 'Миссия',
  8: 'Дары',
  9: 'Позиция 9 · связь 1 и 2',
  10: 'Позиция 10 · связь 2 и 3',
  11: 'Кармическая задача',
  12: 'Психическая гармония',
  13: 'Как человек воспринимает себя',
  14: 'Как человека воспринимают окружающие',
  15: 'Способ проработки кармы',
  17: 'Кармический комфорт',
  18: 'Работа с миссией',
  30: 'Зона дискомфорта',
};

const LETTER_CODES: Record<string, number> = {
  А: 22, Б: 1, В: 2, Г: 3, Д: 4, Е: 5, Ё: 5, Ж: 6, З: 6, И: 7, Й: 7,
  К: 8, Л: 9, М: 10, Н: 11, О: 12, П: 13, Р: 14, С: 15, Т: 16, У: 17,
  Ф: 18, Х: 18, Ц: 15, Ч: 3, Ш: 19, Щ: 19, Ъ: 20, Ы: 20, Ь: 20, Э: 5,
  Ю: 21, Я: 21,
  A: 22, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9, K: 10,
  L: 11, M: 12, N: 13, O: 14, P: 15, R: 16, S: 17, T: 18, U: 14,
  W: 19, Y: 20, Z: 21,
};

/**
 * The workbook's rule is to subtract 22 when a value exceeds 22.
 * Keep 22 as 22; repeatedly subtract for larger name totals.
 */
export function reduceToArcana(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('Код должен быть неотрицательным числом.');
  }
  let result = Math.trunc(value);
  while (result > 22) result -= 22;
  return result;
}

function reduceToSingleDigit(value: number): number {
  let result = Math.trunc(value);
  while (result > 9) {
    result = String(result).split('').reduce((sum, digit) => sum + Number(digit), 0);
  }
  return result;
}

function difference(left: number, right: number) {
  return Math.abs(left - right);
}

function makeNameCode(field: NameCode['field'], value: string): NameCode {
  const letters = Array.from(value.toLocaleUpperCase('ru-RU'))
    .filter((character) => /\p{L}/u.test(character));
  const unsupportedLetters: string[] = [];
  let rawTotal = 0;

  for (const letter of letters) {
    const code = LETTER_CODES[letter];
    if (code === undefined) unsupportedLetters.push(letter);
    else rawTotal += code;
  }

  const code = rawTotal > 0 ? reduceToArcana(rawTotal) : null;
  return {
    field,
    rawTotal,
    code,
    arcana: code === null ? null : ARCANA_NAMES[code] ?? null,
    unsupportedLetters: [...new Set(unsupportedLetters)],
  };
}

function assertIsoDate(birthDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) throw new Error('Дата рождения должна быть в формате ГГГГ-ММ-ДД.');
  const [, yearText, monthText, dayText] = match;
  const date = new Date(`${birthDate}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== birthDate ||
    Number(yearText) < 1 ||
    Number(monthText) < 1 ||
    Number(dayText) < 1
  ) {
    throw new Error('Укажите корректную дату рождения.');
  }
  return {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
  };
}

export function calculatePortrait(
  birthDate: string,
  person: PortraitPersonFields,
): PortraitCalculation {
  const { year, month, day } = assertIsoDate(birthDate);
  const position1 = reduceToArcana(day);
  const position2 = month;
  const yearDigitSum = String(year).split('').reduce((sum, digit) => sum + Number(digit), 0);
  const position3 = reduceToArcana(yearDigitSum);
  const position4 = reduceToArcana(position1 + position2);
  const position5 = reduceToArcana(position2 + position3);
  const position6 = reduceToArcana(position4 + position5);
  const position7 = reduceToArcana(position1 + position5);
  const position8 = reduceToArcana(position2 + position6);
  const position9 = difference(position1, position2);
  const position10 = difference(position2, position3);
  const position11 = difference(position9, position10);
  const position12FromInner = reduceToArcana(position4 + position5 + position6);
  const position12FromMission = reduceToArcana(position7 + position8);

  if (position12FromInner !== position12FromMission) {
    throw new Error('Проверка двух формул позиции 12 не совпала.');
  }

  const position12 = position12FromInner;
  const position13 = reduceToArcana(position1 + position4 + position6);
  const position14 = reduceToArcana(position3 + position5 + position6);
  const position15 = difference(position9 + position10 + position11, position7);
  const position17 = reduceToArcana(position11 + position6);
  const position18 = reduceToArcana(position11 + position8);
  const position30 = reduceToArcana(position12 * 2);
  const birthDigitSum = `${birthDate.slice(0, 4)}${birthDate.slice(5, 7)}${birthDate.slice(8, 10)}`
    .split('')
    .reduce((sum, digit) => sum + Number(digit), 0);
  const lifePath = reduceToSingleDigit(birthDigitSum);

  const codes: Array<[number, number]> = [
    [1, position1], [2, position2], [3, position3],
    [4, position4], [5, position5], [6, position6],
    [7, position7], [8, position8], [9, position9],
    [10, position10], [11, position11], [12, position12],
    [13, position13], [14, position14], [15, position15],
    [17, position17], [18, position18], [30, position30],
  ];

  return {
    version: 1,
    positions: codes.map(([number, code]) => ({
      number,
      label: POSITION_LABELS[number],
      code,
      arcana: ARCANA_NAMES[code] ?? null,
    })),
    nameCodes: [
      makeNameCode('Фамилия', person.lastName),
      makeNameCode('Имя', person.firstName),
      makeNameCode('Отчество', person.middleName),
    ],
    lifePath,
    ageBoundary: 36 - lifePath,
  };
}

export function isPortraitCalculation(value: unknown): value is PortraitCalculation {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PortraitCalculation>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.positions) &&
    candidate.positions.every((item) =>
      item &&
      typeof item.number === 'number' &&
      typeof item.label === 'string' &&
      typeof item.code === 'number' &&
      (typeof item.arcana === 'string' || item.arcana === null),
    ) &&
    Array.isArray(candidate.nameCodes) &&
    candidate.nameCodes.every((item) =>
      item &&
      typeof item.field === 'string' &&
      typeof item.rawTotal === 'number' &&
      (typeof item.code === 'number' || item.code === null) &&
      (typeof item.arcana === 'string' || item.arcana === null) &&
      Array.isArray(item.unsupportedLetters),
    ) &&
    typeof candidate.lifePath === 'number' &&
    typeof candidate.ageBoundary === 'number'
  );
}
