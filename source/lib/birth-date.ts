/** Validate calendar dates without comparing local midnight with UTC. */
export function normalizeBirthDate(value: string, now = new Date()): string | null {
  const input = value.trim();
  const local = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(input);
  const digits = /^(\d{2})(\d{2})(\d{4})$/.exec(input);
  const parts = local ?? digits;
  const iso = parts
    ? `${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
    : input;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number(iso.slice(0, 4)) < 1) return null;
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return null;
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return iso > today ? null : iso;
}
