import "@/lib/i18n";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { TemporalField } from "./temporal-field";

afterEach(cleanup);
it("uses one time input and serializes minute-only and second-precision edits", () => {
  render(
    <form aria-label="route">
      <TemporalField label="Giờ ghé" type="time" name="arrival" required />
    </form>,
  );
  const form = screen.getByRole("form") as HTMLFormElement;
  const input = screen.getByLabelText("Giờ ghé", { selector: "input" });
  expect(screen.queryByRole("combobox")).toBeNull();
  for (const [value, expected] of [
    ["00:00", "00:00:00"],
    ["07:15:09", "07:15:09"],
    ["", ""],
  ]) {
    fireEvent.change(input, { target: { value } });
    expect(new FormData(form).get("arrival")).toBe(expected);
    expect((input as HTMLInputElement).validity.valid).toBe(Boolean(value));
  }
});

it("keeps a school date, midnight with seconds, and an unset optional time distinct", () => {
  render(
    <form aria-label="schedule">
      <TemporalField
        label="Ngày"
        type="date"
        name="date"
        defaultValue="2026-11-19"
      />
      <TemporalField
        label="Giờ"
        type="time"
        name="time"
        defaultValue="00:00:07"
      />
      <TemporalField label="Đến" type="datetime-local" name="end" />
    </form>,
  );
  const data = new FormData(screen.getByRole("form") as HTMLFormElement);
  expect(Object.fromEntries(data)).toEqual({
    date: "2026-11-19",
    time: "00:00:07",
    end: "",
  });
});

it("serializes external datetime replacements and resets", () => {
  const field = (value: string) => <form aria-label="trip">
    <TemporalField label="Giờ" type="datetime-local" name="end" value={value} />
  </form>;
  const { rerender } = render(field("2026-09-03T07:00"));
  for (const value of ["2026-09-04T09:30", ""]) {
    rerender(field(value));
    expect(new FormData(screen.getByRole("form") as HTMLFormElement).get("end")).toBe(value);
  }
});
