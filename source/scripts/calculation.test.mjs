import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
import { calculatePortrait } from '../lib/calculation.ts';
import { getNameInterpretations, getPositionInterpretations } from '../lib/interpretations.ts';
import { normalizeBirthDate } from '../lib/birth-date.ts';
import { BOOK_READINGS, BOOK_SOURCES, bookCitation, getBookReadings, getReportContext } from '../lib/books.ts';

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

test('provides traceable selected passages from all four supplied PDF books', () => {
  assert.deepEqual(new Set(BOOK_SOURCES.map((source) => source.id)), new Set(['magic', 'portrait', 'mystery', 'health']));
  assert.equal(BOOK_READINGS.length, 41);
  assert.equal(new Set(BOOK_READINGS.map((reading) => reading.id)).size, BOOK_READINGS.length);
  for (const reading of BOOK_READINGS) {
    const source = BOOK_SOURCES.find((item) => item.id === reading.sourceId);
    assert.ok(source, reading.id);
    assert.ok(reading.text.trim().length > 50, reading.id);
    assert.ok(reading.pdfPages.length > 0, reading.id);
    assert.ok(reading.pdfPages.every((page) => page >= 1 && page <= source.pageCount), reading.id);
    assert.ok(bookCitation(reading).includes(source.title), reading.id);
    assert.doesNotMatch(reading.text, /Другие названия:|ЧАСТЬ ТРЕТЬЯ|\b\d{2}\.\d{2}\.\d{4}\b/, reading.id);
  }
});

test('maps book Fool 0 to workbook code 22 without shifting the other arcana', () => {
  const cards = BOOK_READINGS.filter((reading) => reading.scope === 'arcana');
  assert.equal(cards.length, 22);
  assert.deepEqual(cards.map((reading) => reading.arcanaCode).sort((a, b) => a - b), Array.from({ length: 22 }, (_, index) => index + 1));
  assert.match(getBookReadings(7, 22).find((reading) => reading.scope === 'arcana').title, /Шут/);
  assert.match(getBookReadings(7, 1).find((reading) => reading.scope === 'arcana').title, /Маг/);
  assert.match(getBookReadings(7, 8).find((reading) => reading.scope === 'arcana').title, /Справедливость/);
  assert.match(getBookReadings(7, 11).find((reading) => reading.scope === 'arcana').title, /Сила/);
});

test('combines workbook and book passages for actual report positions with citations', () => {
  for (const [position, code] of [[7, 22], [8, 12], [12, 12], [13, 8], [14, 4]]) {
    const blocks = getPositionInterpretations(position, code);
    assert.ok(blocks.some((block) => block.source?.kind === 'workbook'));
    assert.ok(blocks.some((block) => block.source?.sourceId === 'magic'));
    assert.ok(blocks.some((block) => block.source?.sourceId === 'portrait'));
    assert.ok(blocks.filter((block) => block.source?.kind === 'book').every((block) => block.source?.readingId && block.source.pdfPages.length));
  }
  assert.ok(getNameInterpretations(8).some((block) => block.source?.sourceId === 'magic'));
});

test('keeps minor suits and health passages as reference, never as computed personal predictions', () => {
  const reference = BOOK_READINGS.filter((reading) => ['mystery', 'health'].includes(reading.sourceId));
  assert.equal(reference.length, 7);
  assert.ok(reference.every((reading) => reading.scope === 'reference' && reading.arcanaCode === undefined && reading.positions === undefined));
  const context = getReportContext();
  assert.deepEqual(context.map((reading) => reading.sourceId), ['portrait', 'mystery', 'health']);
  assert.match(context.find((reading) => reading.sourceId === 'health').text, /не заменяют визита к врачу/);
});

test('PDF keeps enriched interpretations but never displays books, authors or source pages', () => {
  const code = fs.readFileSync(new URL('../lib/pdf.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const shims = {
    'expo-print': {},
    'expo-sharing': {},
    'react-native': { Platform: { OS: 'web' } },
    '@/lib/calculation': { calculatePortrait },
    '@/lib/interpretations': { getNameInterpretations, getPositionInterpretations },
    '@/lib/books': { getReportContext },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)((id) => {
    assert.ok(id in shims, `Unexpected PDF dependency: ${id}`);
    return shims[id];
  }, module, module.exports);
  const html = module.exports.portraitReportHtml({
    id: 'test', firstName: 'Тест', middleName: 'Тестович', lastName: '<Проверка>',
    birthDate: '2005-06-09', createdAt: '2026-10-22T00:00:00Z',
  });
  assert.match(html, /начало нового цикла/);
  assert.match(html, /Что означает психическая гармония/);
  assert.match(html, /&lt;Проверка&gt;/);
  for (const source of BOOK_SOURCES) assert.ok(!html.includes(source.title), source.id);
  assert.doesNotMatch(html, /Хшанов|Залесск|стр\. файла PDF|ИСТОЧНИК|Источники и объём|Авторская таблица Excel/);
});
