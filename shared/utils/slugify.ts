// Derive a URL/DB-safe slug from a display name. Vietnamese-aware: strip
// combining marks after NFD, map d-stroke, collapse non-alphanumerics.
// Uses \u escapes (not literal marks) so the source survives every compile
// step. Keep in sync with backend/src/utils/slugify.ts.
export function slugify(input: string): string {
    return input
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // strip combining diacritical marks
        .replace(/\u0111/g, "d") // d with stroke (lowercase)
        .replace(/\u0110/g, "d") // D with stroke (uppercase)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
