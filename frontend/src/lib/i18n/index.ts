import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./resources";

export type Language = "vi" | "en";
export const languageStorageKey = "guardianway.language";
export const i18n = createInstance();
void i18n.use(initReactI18next).init({
    resources,
    lng: "vi",
    fallbackLng: "en",
    supportedLngs: ["vi", "en"],
    initAsync: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
});

function errorKey(code: string): string {
    // Check our own catalogue so an untrusted code cannot select other namespaces.
    const key = Object.hasOwn(resources.en.translation.errors, code)
        ? code
        : "UNKNOWN_ERROR";
    return "errors." + key;
}

export function errorMessage(code: string): string {
    return i18n.t(errorKey(code));
}

export function getErrorKey(error: unknown): string {
    if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
    ) {
        return errorKey(error.code);
    }
    return errorKey("UNKNOWN_ERROR");
}

export function getErrorMessage(error: unknown): string {
    return i18n.t(getErrorKey(error));
}
