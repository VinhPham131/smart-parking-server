export function normalizePlate(raw: string): string {
    const cleaned = raw.replace(/[.\s-]/g, '');
    return cleaned.replace(/^(\d{2}[A-Z])(\d{5})$/, '$1-$2');
}