import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Person } from '@/lib/people';
import { calculatePortrait, PortraitCalculation, PortraitPosition } from '@/lib/calculation';
import { getNameInterpretations, getPositionInterpretations } from '@/lib/interpretations';
import type { InterpretationBlock } from '@/lib/interpretations';
import { getReportContext } from '@/lib/books';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const POSITION_GROUPS: Array<{ title: string; numbers: number[] }> = [
  { title: 'Жизненный путь', numbers: [1, 2, 3] },
  { title: 'Психика и миссия', numbers: [4, 5, 6, 7, 8] },
  { title: 'Кармические позиции', numbers: [9, 10, 11, 15, 17, 18] },
  { title: 'Гармония и восприятие', numbers: [12, 13, 14, 30] },
];

function positionMarkup(position: PortraitPosition) {
  const cardName = position.arcana
    ? `${position.code} · ${position.arcana}`
    : `Код ${position.code} · аркан не найден`;
  const interpretations = getPositionInterpretations(position.number, position.code)
    .map(interpretationMarkup)
    .join('');
  return `<article class="position-card"><div class="position-heading"><div class="position-number">${position.number}</div><div><div class="position-label">${escapeHtml(position.label)}</div><div class="position-value">${escapeHtml(cardName)}</div></div></div>${interpretations}</article>`;
}

function interpretationMarkup(block: InterpretationBlock) {
  const note = block.note ? `<div class="reading-note">${escapeHtml(block.note)}</div>` : '';
  return `<div class="interpretation"><strong>${escapeHtml(block.title)}</strong>${formatParagraphs(block.text)}${note}</div>`;
}

function formatParagraphs(value: string) {
  return escapeHtml(value)
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function portraitReportHtml(person: Person) {
  const fullName = `${person.lastName} ${person.firstName} ${person.middleName}`;
  const birthDate = new Date(`${person.birthDate}T00:00:00`).toLocaleDateString('ru-RU');
  const calculation: PortraitCalculation =
    person.calculation ?? calculatePortrait(person.birthDate, person);
  const sections = POSITION_GROUPS.map(({ title, numbers }) => {
    const rows = numbers
      .map((number) => calculation.positions.find((position) => position.number === number))
      .filter((position): position is PortraitPosition => Boolean(position))
      .map(positionMarkup)
      .join('');
    return `<section><h2>${escapeHtml(title)}</h2><div class="positions">${rows}</div></section>`;
  }).join('');
  const nameCodes = calculation.nameCodes.map((item) => {
    const value = item.code === null
      ? 'нет букв с кодом'
      : `${item.code} · ${item.arcana ?? 'аркан не найден'}`;
    const warning = item.unsupportedLetters.length
      ? `<div class="warning">Нет значения в таблице для: ${escapeHtml(item.unsupportedLetters.join(', '))}</div>`
      : '';
    const interpretation = getNameInterpretations(item.code)
      .map(interpretationMarkup)
      .join('');
    return `<div class="name-code"><span>${escapeHtml(item.field)}</span><strong>${escapeHtml(value)}</strong><small>Сумма букв: ${item.rawTotal}</small>${interpretation}${warning}</div>`;
  }).join('');
  const overview = [7, 8, 12].map((number) => {
    const position = calculation.positions.find((item) => item.number === number);
    if (!position) return '';
    return `<div class="overview-card"><span>${escapeHtml(position.label)}</span><strong>${position.code}</strong><small>${escapeHtml(position.arcana ?? '')}</small></div>`;
  }).join('');
  const context = getReportContext().map((reading) =>
    `<article class="context-card"><h3>${escapeHtml(reading.title)}</h3>${formatParagraphs(reading.text)}${reading.note ? `<div class="reading-note">${escapeHtml(reading.note)}</div>` : ''}</article>`,
  ).join('');

  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #3F2631; font-family: -apple-system, BlinkMacSystemFont, "Arial", sans-serif; font-size: 10pt; }
  .eyebrow { color: #875C6D; font-size: 10px; letter-spacing: 2px; font-weight: 700; }
  h1 { margin: 12px 0 8px; font-size: 26px; line-height: 1.3; }
  .birth { color: #758179; font-size: 12px; margin-bottom: 18px; }
  h1, h2, h3 { font-family: Georgia, "Times New Roman", serif; }
  h2 { margin: 28px 0 14px; font-size: 18px; break-after: avoid; }
  h3 { font-size: 14px; margin: 0 0 8px; }
  .overview { display: flex; gap: 12px; margin: 22px 0; }
  .overview-card { flex: 1; padding: 18px; background: #F5EEE6; border: 1px solid #E6D7C8; border-radius: 12px; }
  .overview-card span, .overview-card small { display: block; font-size: 10px; }
  .overview-card strong { display: block; font-family: Georgia, serif; font-size: 34px; margin: 8px 0; color: #743B51; }
  .positions { display: flex; flex-direction: column; gap: 9px; }
  .position-card { padding: 16px; margin-bottom: 15px; border: 1px solid #E4DFD4; border-radius: 9px; }
  .position-heading { display: flex; align-items: center; gap: 9px; break-inside: avoid; }
  .position-number { width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: #EEE6D7; font-size: 11px; font-weight: 700; }
  .position-label { color: #758179; font-size: 9px; line-height: 1.35; }
  .position-value { margin-top: 3px; font-size: 11px; font-weight: 700; }
  .interpretation { margin-top: 15px; }
  .interpretation strong, .name-interpretation strong { font-size: 10pt; break-after: avoid; }
  .interpretation p, .name-interpretation p, .context-card p { margin: 7px 0 0; color: #51434A; font-size: 10pt; line-height: 1.6; orphans: 3; widows: 3; }
  .reading-note { font-size: 8pt; line-height: 1.5; margin-top: 6px; color: #77666C; font-style: italic; }
  .name-interpretation { margin-top: 8px; }
  .name-codes { display: block; }
  .name-code { padding: 16px; margin-bottom: 15px; border-radius: 9px; background: #F7F4EC; }
  .name-code span, .name-code small { display: block; color: #758179; font-size: 9px; }
  .name-code strong { display: block; margin: 6px 0; font-size: 11px; }
  .warning { color: #9D5147; font-size: 9px; line-height: 1.4; margin-top: 6px; }
  .note { margin-top: 18px; padding: 12px; border-radius: 10px; background: #F7F4EC; color: #59675F; font-size: 10px; line-height: 1.5; }
  .context-card { margin-bottom: 18px; padding: 15px; background: #F7F3EC; }
  footer { position: fixed; bottom: 0; left: 0; right: 0; color: #758179; font-size: 10px; }
</style></head><body>
  <div class="eyebrow">ЦИФРОВОЙ ПОРТРЕТ · ЛИЧНЫЙ РАЗБОР</div>
  <h1>${escapeHtml(fullName)}</h1>
  <div class="birth">Дата рождения: ${escapeHtml(birthDate)}</div>
  <div class="overview">${overview}</div>
  <div class="note">Начните с ключевых тем, затем переходите к подробному разбору позиций. Портрет предлагает символический взгляд на жизненные задачи и не ограничивает вашу свободу выбора.</div>
  <section><h2>Коды ФИО по алфавитной таблице</h2><div class="name-codes">${nameCodes}</div></section>
  ${sections}
  <section><h2>Как читать этот портрет</h2>${context}</section>
  <div class="note"><strong>Важно:</strong> это авторская символическая методика, а не медицинская диагностика или стандартизированное психологическое заключение. Младшие арканы приведены как справочное чтение, не как дополнительные результаты расчёта. Материалы о здоровье не определяют болезни и не заменяют врача.</div>
  <footer>Создано ${escapeHtml(new Date().toLocaleDateString('ru-RU'))}</footer>
</body></html>`;
}

export async function exportPortraitPdf(person: Person) {
  const html = portraitReportHtml(person);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('На устройстве недоступно меню отправки файлов.');
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `Портрет — ${person.lastName} ${person.firstName}`,
  });
}
