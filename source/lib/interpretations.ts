import { INTERPRETATION_LIBRARY } from './interpretation-data.ts';
import type { InterpretationSection } from './interpretation-data.ts';
import { bookCitation, getBookReadings } from './books.ts';
import type { BookReading } from './books.ts';

export type InterpretationBlock = {
  title: string;
  text: string;
  note?: string;
  source?: {
    kind: 'workbook' | 'book';
    sourceId: string;
    label: string;
    readingId?: string;
    pdfPages?: number[];
  };
};

const sectionTitles: Record<InterpretationSection, string> = {
  mission: 'Миссия',
  gifts: 'Дары для выполнения миссии',
  harmony: 'Психическая гармония',
  selfView: 'Восприятие себя',
  othersView: 'Восприятие окружающими',
};

function addBlock(blocks: InterpretationBlock[], title: string, text: string | null | undefined) {
  if (text?.trim()) blocks.push({
    title, text: text.trim(),
    source: { kind: 'workbook', sourceId: 'workbook', label: 'Авторская таблица Excel' },
  });
}

export function bookInterpretation(reading: BookReading): InterpretationBlock {
  return {
    title: reading.scope === 'arcana' ? 'Психологический образ' : reading.title,
    text: reading.text,
    note: reading.note,
    source: {
      kind: 'book', sourceId: reading.sourceId, readingId: reading.id,
      label: bookCitation(reading), pdfPages: reading.pdfPages,
    },
  };
}

export function getPositionReport(number: number, code: number) {
  const blocks = getPositionInterpretations(number, code);
  const primary = blocks.filter((block) => block.source?.kind === 'book')
    .sort((a, b) => Number(b.source?.sourceId === 'magic') - Number(a.source?.sourceId === 'magic'));
  const normalize = (text: string) => text.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/[^а-яa-z0-9]/g, '');
  const primaryTexts = new Set(primary.map((block) => normalize(block.text)));
  const details = blocks.filter((block) => block.source?.kind !== 'book' && !primaryTexts.has(normalize(block.text)));
  return { primary, details };
}

export function getPositionInterpretations(number: number, code: number): InterpretationBlock[] {
  const card = INTERPRETATION_LIBRARY.cards[code];
  if (!card) return [];

  const blocks: InterpretationBlock[] = [];
  addBlock(blocks, 'Общее описание аркана', card.summary);

  switch (number) {
    case 1:
      addBlock(blocks, 'Задачи позиции 1', card.position1Task);
      break;
    case 2:
      addBlock(blocks, 'Характер в позиции 2', card.position2Character);
      addBlock(blocks, 'Уроки позиции 2', card.position2Lesson);
      addBlock(blocks, 'Влияние матери', card.position2Mother);
      break;
    case 3:
      addBlock(blocks, 'Итог жизни по позиции 3', card.lateLifeResultPosition3);
      break;
    case 4:
      addBlock(blocks, 'Уязвимые места детства', card.position4Childhood);
      addBlock(blocks, 'Страхи и комплексы взрослого', card.position4Adult);
      break;
    case 5:
      addBlock(blocks, 'Профессия по позиции 5', card.professionPosition5);
      break;
    case 6:
      addBlock(blocks, 'Тема жизни по позиции 6', card.lifeThemePosition6);
      break;
    case 7:
    case 18: {
      const section: InterpretationSection = 'mission';
      addBlock(
        blocks,
        number === 7 ? sectionTitles[section] : 'Как работать с миссией',
        INTERPRETATION_LIBRARY.sections[section][code],
      );
      break;
    }
    case 8: {
      const section: InterpretationSection = 'gifts';
      addBlock(blocks, sectionTitles[section], INTERPRETATION_LIBRARY.sections[section][code]);
      break;
    }
    case 12: {
      const section: InterpretationSection = 'harmony';
      addBlock(blocks, sectionTitles[section], INTERPRETATION_LIBRARY.sections[section][code]);
      break;
    }
    case 13: {
      const section: InterpretationSection = 'selfView';
      addBlock(blocks, sectionTitles[section], INTERPRETATION_LIBRARY.sections[section][code]);
      break;
    }
    case 14: {
      const section: InterpretationSection = 'othersView';
      addBlock(blocks, sectionTitles[section], INTERPRETATION_LIBRARY.sections[section][code]);
      break;
    }
    case 15:
      addBlock(blocks, 'Возможные сложности', card.negative);
      addBlock(blocks, 'Способ проработки и предостережение', card.advice);
      break;
    case 30:
      addBlock(blocks, 'Возможные проявления зоны дискомфорта', card.negative);
      addBlock(blocks, 'Совет-предостережение', card.advice);
      break;
    default:
      addBlock(blocks, 'Возможные сложности', card.negative);
      addBlock(blocks, 'Совет-предостережение', card.advice);
  }

  if (blocks.length === 1) {
    addBlock(blocks, 'Дополнительное описание', card.advice ?? card.negative);
  }

  return [...blocks, ...getBookReadings(number, code).map(bookInterpretation)];
}

export function getNameInterpretations(code: number | null): InterpretationBlock[] {
  if (code === null) return [];
  const card = INTERPRETATION_LIBRARY.cards[code];
  if (!card?.summary) return [];
  const blocks: InterpretationBlock[] = [];
  addBlock(blocks, 'Краткое описание аркана', card.summary);
  return [
    ...getBookReadings(-1, code).map(bookInterpretation),
    ...blocks,
  ];
}
