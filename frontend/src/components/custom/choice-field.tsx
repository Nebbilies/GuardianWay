"use client";
import type { ReactNode } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const all = "__all__";

export function Choice({
    value,
    children,
}: {
    value: string;
    children: ReactNode;
}) {
    return <SelectItem value={value || all}>{children}</SelectItem>;
}

interface ChoiceFieldProps {
    id?: string;
    name?: string;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    required?: boolean;
    "aria-label"?: string;
    placeholder?: string;
    children: ReactNode;
}

export function ChoiceField({
    children,
    placeholder,
    onValueChange,
    value,
    defaultValue,
    id,
    "aria-label": label,
    ...props
}: ChoiceFieldProps) {
    const normalize = (v?: string) => (v === "" && !placeholder ? all : v);
    return (
        <Select
            {...props}
            value={normalize(value)}
            defaultValue={normalize(defaultValue)}
            onValueChange={(v) => onValueChange?.(v === all ? "" : v)}
        >
            <SelectTrigger
                id={id}
                aria-label={label}
                className="w-full min-w-0 bg-card"
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
                {children}
            </SelectContent>
        </Select>
    );
}
