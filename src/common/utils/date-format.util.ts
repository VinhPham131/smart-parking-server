import { DateTimeFormat } from "src/constants/config";

const pad = (value: number): string => value.toString().padStart(2, '0');

export function formatDateTime(date: Date, type: DateTimeFormat): string {
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();

    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    if (type === DateTimeFormat.DATE) {
        return `${day}/${month}/${year}`;
    }

    if (type === DateTimeFormat.DATE_TIME) {
        return `${hours}:${minutes} ${day}/${month}/${year}`;
    }

    if (type === DateTimeFormat.TIME) {
        return `${hours}:${minutes}`;
    }

    return '';
}