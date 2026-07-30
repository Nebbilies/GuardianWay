import { describe, it, expect } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
    it("strips Vietnamese diacritics and lowercases", () => {
        expect(slugify("Trường Tiểu học Nguyễn Du")).toBe("truong-tieu-hoc-nguyen-du");
    });

    it("maps đ/Đ to d", () => {
        expect(slugify("Đại học Đông Đô")).toBe("dai-hoc-dong-do");
    });

    it("collapses non-alphanumerics and trims hyphens", () => {
        expect(slugify("  Hello,  World! ")).toBe("hello-world");
    });

    it("returns empty string when nothing usable remains", () => {
        expect(slugify("!!!")).toBe("");
        expect(slugify("")).toBe("");
    });
});
