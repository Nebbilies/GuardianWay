export function sanitizeSpreadsheetText(value: string | null | undefined): string {
    const text = value ?? "";
    return /^[\s]*[=+@-]/.test(text) ? "'" + text : text;
}
