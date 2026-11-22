"use client";
import { useId, useState } from "react";
import { CalendarDays } from "lucide-react";
import { Popover } from "radix-ui";
import { DayPicker } from "react-day-picker";
import { vi, enUS } from "react-day-picker/locale";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const pad = (v: number) => String(v).padStart(2, "0");

interface Props {
    type: "time" | "date" | "datetime-local";
    label: string;
    name?: string;
    value?: string;
    defaultValue?: string;
    required?: boolean;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
}
export function TemporalField({
    type,
    label,
    name,
    required,
    disabled,
    defaultValue = "",
    value,
    onValueChange,
}: Props) {
    const id = useId();
    const { t, i18n } = useTranslation();
    const [invalid, setInvalid] = useState(false);
    const [open, setOpen] = useState(false);
    const initial = value ?? defaultValue;
    const [localDate, setDate] = useState(
        type === "time" ? "" : initial.split("T")[0],
    );
    const [localTime, setTime] = useState(
        type === "time" ? initial : (initial.split("T")[1] ?? ""),
    );
    const [lastValue, setLastValue] = useState(value);
    if (value !== lastValue) {
        setLastValue(value);
        setDate(type === "time" ? "" : (value?.split("T")[0] ?? ""));
        setTime(type === "time" ? (value ?? "") : (value?.split("T")[1] ?? ""));
    }
    const date =
        value !== undefined && type === "date" ? value : (localDate ?? "");
    const time = value !== undefined && type === "time" ? value : localTime;
    const selected = date ? new Date(date + "T12:00:00") : undefined;
    const dateTime = date && time ? date + "T" + time : "";
    const serialized =
        type === "date" ? date : type === "time" ? time : dateTime;
    const partial =
        type === "datetime-local" && Boolean(date || time) && !dateTime;
    function change(nextDate: string, nextTime: string) {
        setInvalid(false);
        setDate(nextDate);
        setTime(nextTime);
        const nextValue =
            type === "date"
                ? nextDate
                : type === "time"
                  ? nextTime
                  : nextDate && nextTime
                    ? nextDate + "T" + nextTime
                    : "";
        if (value !== undefined) setLastValue(nextValue);
        onValueChange?.(nextValue);
    }
    return (
        <div
            className="flex min-w-0 flex-col gap-2"
            role="group"
            aria-labelledby={id}
            aria-describedby={invalid ? id + "-error" : undefined}
        >
            <span id={id} className="block text-sm font-medium">
                {label}
            </span>
            <div className="flex flex-wrap items-center gap-2">
                {type !== "time" && (
                    <Popover.Root open={open} onOpenChange={setOpen}>
                        <Popover.Trigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={disabled}
                                aria-invalid={invalid || undefined}
                                aria-describedby={
                                    invalid ? id + "-error" : undefined
                                }
                                aria-label={
                                    selected
                                        ? label +
                                          " — " +
                                          selected.toLocaleDateString(
                                              i18n.language,
                                          )
                                        : label
                                }
                                className="min-w-36 grow justify-start bg-card font-normal"
                            >
                                <CalendarDays />
                                {selected
                                    ? selected.toLocaleDateString(i18n.language)
                                    : t("controls.date")}
                            </Button>
                        </Popover.Trigger>
                        <Popover.Portal>
                            <Popover.Content
                                align="start"
                                collisionPadding={12}
                                sideOffset={4}
                                className="gw-popover"
                            >
                                <DayPicker
                                    mode="single"
                                    autoFocus
                                    selected={selected}
                                    defaultMonth={selected}
                                    locale={i18n.language === "en" ? enUS : vi}
                                    onSelect={(day) => {
                                        if (day)
                                            change(
                                                [
                                                    day.getFullYear(),
                                                    pad(day.getMonth() + 1),
                                                    pad(day.getDate()),
                                                ].join("-"),
                                                time,
                                            );
                                        setOpen(false);
                                    }}
                                />
                            </Popover.Content>
                        </Popover.Portal>
                    </Popover.Root>
                )}
                {type !== "date" && (
                    <Input
                        type="time"
                        step={1}
                        aria-label={
                            type === "time"
                                ? label
                                : label + " — " + t("controls.hour")
                        }
                        aria-invalid={invalid || undefined}
                        className="min-w-32 w-auto max-w-full grow bg-card tabular-nums"
                        disabled={disabled}
                        required={
                            required ||
                            (type === "datetime-local" && Boolean(date))
                        }
                        value={time}
                        onChange={(event) => {
                            const next = event.currentTarget.value;
                            change(
                                date,
                                next.length === 5 ? next + ":00" : next,
                            );
                        }}
                    />
                )}
                {!required && (date || time) && (
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={disabled}
                        onClick={() => change("", "")}
                        aria-label={t("controls.clear") + " — " + label}
                    >
                        {t("controls.clear")}
                    </Button>
                )}
            </div>
            <input
                aria-invalid={invalid || undefined}
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only"
                name={name}
                value={serialized}
                disabled={disabled}
                required={required || partial}
                onChange={() => {}}
                onInvalid={(e) => {
                    e.preventDefault();
                    setInvalid(true);
                    const trigger =
                        e.currentTarget.parentElement?.querySelector<HTMLElement>(
                            "button, input[type=time]",
                        );
                    trigger?.focus();
                }}
            />
            {invalid && (
                <p
                    id={id + "-error"}
                    role="alert"
                    className="text-sm text-destructive"
                >
                    {t("controls.completeField", { label })}
                </p>
            )}
        </div>
    );
}
