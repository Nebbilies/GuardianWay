"use client";
import { useTranslation } from "react-i18next";
import { languageStorageKey, type Language } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function LanguageSwitch() {
    const { t, i18n } = useTranslation();
    function select(language: Language) {
        void i18n.changeLanguage(language);
        try {
            window.localStorage.setItem(languageStorageKey, language);
        } catch {
            /* Optional preference. */
        }
    }
    return (
        <div
            role="group"
            aria-label={t("language.label")}
            className="flex items-center gap-1"
        >
            {(["vi", "en"] as const).map((language) => (
                <Button
                    key={language}
                    type="button"
                    size="sm"
                    variant={
                        i18n.resolvedLanguage === language
                            ? "secondary"
                            : "ghost"
                    }
                    aria-pressed={i18n.resolvedLanguage === language}
                    aria-label={t("language." + language)}
                    onClick={() => select(language)}
                >
                    {language.toUpperCase()}
                </Button>
            ))}
        </div>
    );
}
