import assert from 'node:assert/strict';
import test from 'node:test';
import { calculatePortrait } from '../lib/calculation.ts';

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
