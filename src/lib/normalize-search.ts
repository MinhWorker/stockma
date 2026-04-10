export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[\u0111\u0110]/g, (char) => (char === '\u0110' ? 'D' : 'd'))
    .toLowerCase();
}
