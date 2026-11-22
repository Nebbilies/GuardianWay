import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup, waitFor } from "@testing-library/react";
import { I18nProvider } from "./i18n-provider";
import { LanguageSwitch } from "./language-switch";
import { ErrorNotice } from "./error-notice";
import { i18n, languageStorageKey } from "@/lib/i18n";

beforeEach(() => {
    // Node's experimental localStorage shadows jsdom storage in this runtime.
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => { values.set(key, value); },
        clear: () => values.clear(), removeItem: (key: string) => values.delete(key),
    });
});
afterEach(async () => { cleanup(); vi.unstubAllGlobals(); await i18n.changeLanguage("vi"); });
it("updates an existing error when the user switches language and remembers the preference", async () => {
    render(<I18nProvider><LanguageSwitch /><ErrorNotice error={{ code: "INVALID_CREDENTIALS" }} /></I18nProvider>);
    expect(screen.getByRole("alert")).toHaveTextContent("Email hoặc mật khẩu không đúng.");
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("The email or password is incorrect."));
    expect(window.localStorage.getItem(languageStorageKey)).toBe("en");
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
});
