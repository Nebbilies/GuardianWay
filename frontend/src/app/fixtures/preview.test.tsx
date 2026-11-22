import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { FixturePreview } from "./preview";

it("switches from the school list to an empty manifest and a forbidden manifest", async () => {
    render(<FixturePreview />);
    expect(await screen.findByText("200 · 6 đăng ký")).toBeInTheDocument();
    const select = screen.getByRole("combobox", { name: "Tình huống" });
    for (const [label, result] of [
        [
            "Chuyến trả · danh sách trống",
            "200 · 2026-11-23 · PLANNED · 0 hành khách",
        ],
        ["Chuyến của tài xế khác", "403 · Tài khoản này không có quyền xem."],
    ]) {
        const option = screen.getByRole<HTMLOptionElement>("option", {
            name: label,
        });
        fireEvent.change(select, { target: { value: option.value } });
        expect(await screen.findByText(result)).toBeInTheDocument();
    }
});
