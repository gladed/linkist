export const epochDate = new Date("1970-01-01");

/** Search text for the first date string and return it as Date if it is in epoch. */
export function textToDate(text: string): Date | undefined {
    const dateMatch = text.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/);
    if (dateMatch) {
        const date = new Date(dateMatch[0]);
        if (date instanceof Date && !isNaN(date.getTime()) && date > epochDate) {
            return date;
        }
    }
    return;
}
