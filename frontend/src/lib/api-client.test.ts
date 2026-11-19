import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./api-client";
import { i18n, getErrorMessage } from "./i18n";

afterEach(async () => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); await i18n.changeLanguage("vi"); });

describe("API error presentation", () => {
    it("uses the error code instead of exposing the backend detail", async () => {
        vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test/api");
        vi.stubGlobal("fetch", async () => new Response(JSON.stringify({
            code: "AUTHENTICATION_ERROR", detail: "Invalid credentials with diagnostic context", status: 401,
        }), { status: 401 }));
        await expect(apiRequest("/auth/login")).rejects.toMatchObject({
            code: "AUTHENTICATION_ERROR", status: 401, message: "Vui lòng đăng nhập lại.",
        });
    });
    it("renders the same code in English after a language change", async () => {
        await i18n.changeLanguage("en");
        vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test/api");
        vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ code: "INVALID_CREDENTIALS", detail: "Ignored" }), { status: 401 }));
        await expect(apiRequest("/auth/login")).rejects.toMatchObject({ message: "The email or password is incorrect." });
    });
    it("uses a safe localized fallback for an unknown code, even when detail contains markup", async () => {
        vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test/api");
        vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ code: "NEW_UNKNOWN_CODE", detail: "<script>private diagnostics</script>" }), { status: 500 }));
        const error = await apiRequest("/auth/login").catch(error => error);
        expect(getErrorMessage(error)).toBe("Đã xảy ra lỗi. Vui lòng thử lại.");
        await i18n.changeLanguage("en");
        expect(getErrorMessage(error)).toBe("Something went wrong. Please try again.");
    });
    it("localizes network failures and refresh failures through the same path", async () => {
        vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test/api");
        vi.stubGlobal("fetch", async () => { throw new TypeError("Network failed"); });
        await expect(apiRequest("/users")).rejects.toMatchObject({ code: "NETWORK_ERROR", status: 0 });
        const fetch = vi.fn()
            .mockResolvedValueOnce(new Response("{}", { status: 401 }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ code: "AUTHENTICATION_ERROR" }), { status: 401 }));
        vi.stubGlobal("fetch", fetch);
        await expect(apiRequest("/users")).rejects.toMatchObject({ code: "AUTHENTICATION_ERROR", message: "Vui lòng đăng nhập lại." });
        expect(fetch).toHaveBeenCalledTimes(2);
    });
});
