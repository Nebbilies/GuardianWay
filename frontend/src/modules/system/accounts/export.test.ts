import { expect, it } from "vitest";
import { sanitizeSpreadsheetText } from "./export";
it("neutralizes spreadsheet formulas including leading whitespace and preserves normal text", () => {
    expect(sanitizeSpreadsheetText(" =HYPERLINK(\"https://example.test\")")).toBe("' =HYPERLINK(\"https://example.test\")");
    expect(sanitizeSpreadsheetText("@SUM(1,2)")).toBe("'@SUM(1,2)");
    expect(sanitizeSpreadsheetText("Nguyễn An")).toBe("Nguyễn An");
});
