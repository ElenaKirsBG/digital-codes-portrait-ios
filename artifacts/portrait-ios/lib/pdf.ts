import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Person } from '@/lib/people';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function personCardHtml(person: Person) {
  const fullName = `${person.lastName} ${person.firstName} ${person.middleName}`;
  const birthDate = new Date(`${person.birthDate}T00:00:00`).toLocaleDateString('ru-RU');
  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @page { size: A4; margin: 24mm 20mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #18372E; font-family: -apple-system, BlinkMacSystemFont, "Arial", sans-serif; }
  .eyebrow { color: #758179; font-size: 10px; letter-spacing: 2px; font-weight: 700; }
  h1 { margin: 14px 0 26px; font-size: 27px; line-height: 1.3; }
  .line { height: 1px; background: #E4DFD4; margin: 22px 0; }
  .label { color: #758179; font-size: 11px; margin-bottom: 6px; }
  .value { font-size: 16px; font-weight: 600; }
  .note { margin-top: 35px; padding: 16px; border-radius: 12px; background: #F7F4EC; color: #59675F; font-size: 12px; line-height: 1.6; }
  footer { position: fixed; bottom: 0; left: 0; right: 0; color: #758179; font-size: 10px; }
</style></head><body>
  <div class="eyebrow">ЦИФРОВОЙ ПОРТРЕТ · КАРТОЧКА ЧЕЛОВЕКА</div>
  <h1>${escapeHtml(fullName)}</h1>
  <div class="line"></div>
  <div class="label">Дата рождения</div>
  <div class="value">${escapeHtml(birthDate)}</div>
  <div class="note"><strong>Психологический портрет пока не рассчитан.</strong><br>
  Расчётная методика будет подключена после разбора авторских материалов. Эта карточка содержит только введённые данные и не является психологическим заключением.</div>
  <footer>Создано ${escapeHtml(new Date().toLocaleDateString('ru-RU'))}</footer>
</body></html>`;
}

export async function exportPersonCardPdf(person: Person) {
  const html = personCardHtml(person);
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
    dialogTitle: `Карточка — ${person.lastName} ${person.firstName}`,
  });
}
