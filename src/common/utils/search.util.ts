
export function toIlikePattern(keyword: string | undefined | null): string | null {
  const trimmed = keyword?.trim();
  if (!trimmed) {
    return null;
  }
  return `%${trimmed}%`;
}
