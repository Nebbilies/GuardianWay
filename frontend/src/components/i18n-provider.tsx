"use client";
import { useEffect, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { i18n, languageStorageKey } from "@/lib/i18n";

export function I18nProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(languageStorageKey);
            if (saved === "vi" || saved === "en") void i18n.changeLanguage(saved);
        } catch { /* Storage may be disabled; the default language still works. */ }
    }, []);
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
