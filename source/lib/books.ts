import { BOOK_READINGS, BOOK_SOURCES } from './book-data.ts';
import type { BookReading } from './book-types.ts';

export { BOOK_READINGS, BOOK_SOURCES };
export type { BookReading, BookSource } from './book-types.ts';

export function getBookSource(sourceId: string) {
  return BOOK_SOURCES.find((source) => source.id === sourceId);
}

export function bookCitation(reading: BookReading): string {
  const source = getBookSource(reading.sourceId);
  return `${source?.title ?? reading.sourceId} · ${source?.year ?? ''} · стр. файла PDF ${reading.pdfPages.join(', ')}`;
}

export function getBookReadings(position: number, arcanaCode: number): BookReading[] {
  return BOOK_READINGS.filter((reading) =>
    reading.arcanaCode === arcanaCode || reading.positions?.includes(position),
  );
}

export function getReportContext(): BookReading[] {
  return ['portrait-free-will', 'mystery-daily', 'health-boundaries']
    .map((id) => BOOK_READINGS.find((reading) => reading.id === id))
    .filter((reading): reading is BookReading => Boolean(reading));
}
