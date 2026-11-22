"use client";
import { useTranslation } from "react-i18next";
import { getErrorKey } from "@/lib/i18n";

export function ErrorNotice({ error }: { error: unknown }) {
    const { t } = useTranslation();
    return (
        <div
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
            {t(getErrorKey(error))}
        </div>
    );
}
