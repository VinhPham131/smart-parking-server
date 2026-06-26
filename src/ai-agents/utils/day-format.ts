export function formatDayFromPrompt(date: string): string {
    const dateOnly = date.trim().split('T')[0];
    const separator = dateOnly.includes('/') ? '/' : '-';
    const parts = dateOnly.split(separator).map((p) => p.trim());

    if (parts.length !== 3) {
        return dateOnly;
    }

    if (parts[0].length === 4) {
        const [year, month, day] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    if (parts[2].length === 4) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return dateOnly;
}
