import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Person } from '@/lib/people';
import { calculatePortrait, PortraitCalculation, PortraitPosition } from '@/lib/calculation';

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
  return `<div class="position"><div class="position-number">${position.number}</div><div><div class="position-label">${escapeHtml(position.label)}</div><div class="position-value">${escapeHtml(cardName)}</div></div></div>`;
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
    return `<div class="name-code"><span>${escapeHtml(item.field)}</span><strong>${escapeHtml(value)}</strong><small>Сумма букв: ${item.rawTotal}</small>${warning}</div>`;
  }).join('');

  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #18372E; font-family: -apple-system, BlinkMacSystemFont, "Arial", sans-serif; }
  .eyebrow { color: #758179; font-size: 10px; letter-spacing: 2px; font-weight: 700; }
  h1 { margin: 12px 0 8px; font-size: 26px; line-height: 1.3; }
  .birth { color: #758179; font-size: 12px; margin-bottom: 18px; }
  h2 { margin: 22px 0 10px; font-size: 15px; }
  .positions { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
  .position { display: flex; align-items: center; gap: 9px; padding: 9px; border: 1px solid #E4DFD4; border-radius: 9px; break-inside: avoid; }
  .position-number { width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: #EEE6D7; font-size: 11px; font-weight: 700; }
  .position-label { color: #758179; font-size: 9px; line-height: 1.35; }
  .position-value { margin-top: 3px; font-size: 11px; font-weight: 700; }
  .name-codes { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .name-code { padding: 10px; border-radius: 9px; background: #F7F4EC; break-inside: avoid; }
  .name-code span, .name-code small { display: block; color: #758179; font-size: 9px; }
  .name-code strong { display: block; margin: 6px 0; font-size: 11px; }
  .warning { color: #9D5147; font-size: 9px; line-height: 1.4; margin-top: 6px; }
  .note { margin-top: 18px; padding: 12px; border-radius: 10px; background: #F7F4EC; color: #59675F; font-size: 10px; line-height: 1.5; }
  footer { position: fixed; bottom: 0; left: 0; right: 0; color: #758179; font-size: 10px; }
</style></head><body>
  <div class="eyebrow">ЦИФРОВОЙ ПОРТРЕТ · РАСЧЁТНЫЙ ОТЧЁТ</div>
  <h1>${escapeHtml(fullName)}</h1>
  <div class="birth">Дата рождения: ${escapeHtml(birthDate)}</div>
  <section><h2>Коды ФИО по алфавитной таблице</h2><div class="name-codes">${nameCodes}</div></section>
  ${sections}
  <div class="note"><strong>Важно:</strong> отчёт показывает коды и названия арканов по расчётной таблице. Это символическая методика, а не медицинская диагностика или стандартизированное психологическое заключение. Тексты толкований из книг в отчёт не включены.</div>
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
