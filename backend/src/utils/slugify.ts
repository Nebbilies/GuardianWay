// Backend-local copy of the shared slugify. The backend compiles this into
// dist as normal CommonJS; importing the util from "@gw/shared" would force
// Node to load the shared package's raw .ts at runtime, which its loader can't
// resolve. Keep this in sync with shared/utils/slugify.ts (used by the frontend).
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
