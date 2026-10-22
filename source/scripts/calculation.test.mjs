import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePortrait } from '../lib/calculation.ts';
import { getNameInterpretations, getPositionInterpretations } from '../lib/interpretations.ts';
import { normalizeBirthDate } from '../lib/birth-date.ts';

test('validates birth dates independently of the local timezone', () => {
  const previous = process.env.TZ;
  try {
    for (const timezone of ['Europe/Moscow', 'Europe/Sofia', 'America/Los_Angeles', 'UTC']) {
      process.env.TZ = timezone;
      const now = new Date('2026-10-22T12:00:00Z');
      assert.equal(normalizeBirthDate('09.06.2005', now), '2005-06-09', timezone);
      assert.equal(normalizeBirthDate('9.6.2005', now), '2005-06-09', timezone);
      assert.equal(normalizeBirthDate('09062005', now), '2005-06-09', timezone);
      assert.equal(normalizeBirthDate('2005-06-09', now), '2005-06-09', timezone);
      assert.equal(normalizeBirthDate('29.02.2024', now), '2024-02-29', timezone);
      assert.equal(normalizeBirthDate('29.02.2023', now), null, timezone);
      assert.equal(normalizeBirthDate('31.04.2005', now), null, timezone);
      assert.equal(normalizeBirthDate('01.01.2027', now), null, timezone);
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('uses the workbook formulas for the 09.06.2005 example', () => {
  const result = calculatePortrait('2005-06-09', {
    firstName: 'Тест',
    middleName: 'Проверка',
    lastName: 'Пример',
  });

  assert.deepEqual(
    Object.fromEntries(result.positions.map(({ number, code }) => [number, code])),
    {
      1: 9,
      2: 6,
      3: 7,
      4: 15,
      5: 13,
      6: 6,
      7: 22,
      8: 12,
      9: 3,
      10: 1,
      11: 2,
      12: 12,
      13: 8,
      14: 4,
      15: 16,
      17: 8,
      18: 14,
      30: 2,
    },
  );
  assert.equal(result.lifePath, 4);
  assert.equal(result.ageBoundary, 32);
});

test('reduces name totals by the workbook letter table and flags missing letters', () => {
  const result = calculatePortrait('2005-06-09', {
    firstName: 'Тест',
    middleName: 'AA',
    lastName: 'Q',
  });

  assert.equal(result.nameCodes.find(({ field }) => field === 'Имя')?.code, 8);
  assert.equal(result.nameCodes.find(({ field }) => field === 'Отчество')?.code, 22);
  assert.deepEqual(result.nameCodes.find(({ field }) => field === 'Фамилия')?.unsupportedLetters, ['Q']);
  assert.equal(result.nameCodes.find(({ field }) => field === 'Фамилия')?.code, null);
});

test('rejects impossible birth dates', () => {
  assert.throws(() =>
    calculatePortrait('2005-02-30', { firstName: 'А', middleName: 'Б', lastName: 'В' }),
  );
});

test('attaches aspect-specific workbook interpretations to the example positions', () => {
  const result = calculatePortrait('2005-06-09', {
    firstName: 'Тест',
    middleName: 'Проверка',
    lastName: 'Пример',
  });
  const byNumber = new Map(result.positions.map((position) => [position.number, position]));

  assert.match(
    getPositionInterpretations(7, byNumber.get(7).code).find(({ title }) => title === 'Миссия')?.text ?? '',
    /миссия человека состоит/i,
  );
  assert.match(
    getPositionInterpretations(8, byNumber.get(8).code).find(({ title }) => title === 'Дары для выполнения миссии')?.text ?? '',
    /дар/i,
  );
  assert.match(
    getPositionInterpretations(13, byNumber.get(13).code).find(({ title }) => title === 'Восприятие себя')?.text ?? '',
    /человек считает себя справедливым/i,
  );
  assert.match(
    getPositionInterpretations(14, byNumber.get(14).code).find(({ title }) => title === 'Восприятие окружающими')?.text ?? '',
    /такого человека считают решительным/i,
  );
  assert.ok(getNameInterpretations(8)[0].text.length > 0);
  assert.equal(getPositionInterpretations(30, 99).length, 0);
});
