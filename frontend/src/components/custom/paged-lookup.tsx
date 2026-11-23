"use client";
import { useState, useId, type ReactNode } from "react";
import useSWR from "swr";
import { Command } from "cmdk";
import { Popover } from "radix-ui";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/error-notice";
import type { ListParams, PaginatedResponse } from "@/lib/http/contracts";

interface Props<Row> {
    cacheKey: string | readonly unknown[];
    label: string;
    value: string;
    onChange: (id: string) => void;
    load: (query: ListParams) => Promise<PaginatedResponse<Row>>;
    describe: (row: Row) => string;
    renderOption?: (row: Row) => ReactNode;
    required?: boolean;
    selectedLabel?: string;
    disabled?: boolean;
    resolveLabel?: (id: string) => Promise<string>;
}
export function PagedLookup<Row extends { id: string }>({
    cacheKey,
    label,
    value,
    onChange,
    load,
    describe,
    renderOption,
    required,
    selectedLabel,
    disabled,
    resolveLabel,
}: Props<Row>) {
    const { t } = useTranslation();
    const id = useId();
    const [invalid, setInvalid] = useState(false);
    const [open, setOpen] = useState(false),
        [search, setSearch] = useState(""),
        [page, setPage] = useState(1);
    const [selection, setSelection] = useState<{ id: string; label: string }>();
    const { data, error, isValidating, mutate } = useSWR(
        open ? [cacheKey, search, page] : null,
        () => load({ search, page, limit: 10 }),
    );
    const row = data?.data.find((item) => item.id === value);
    const { data: resolvedLabel } = useSWR(
        value && !selectedLabel && selection?.id !== value && resolveLabel
            ? [cacheKey, "label", value]
            : null,
        () => resolveLabel!(value),
    );
    const selected = row
        ? describe(row)
        : selection?.id === value
          ? selection.label
          : (selectedLabel ?? resolvedLabel);
    function choose(id: string, name: string) {
        setInvalid(false);
        setSelection({ id, label: name });
        onChange(id);
        setOpen(false);
    }
    return (
        <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor={id} className="block text-sm font-medium">
                {label}
            </label>
            <Popover.Root
                open={open}
                onOpenChange={(next) => {
                    setOpen(next);
                    if (next) {
                        setPage(1);
                        setSearch("");
                    }
                }}
            >
                <Popover.Trigger asChild>
                    <Button
                        type="button"
                        id={id}
                        aria-invalid={invalid || undefined}
                        aria-describedby={invalid ? id + "-error" : undefined}
                        disabled={disabled}
                        variant="outline"
                        aria-expanded={open}
                        className="flex w-full justify-between bg-card font-normal"
                    >
                        <span className="truncate">
                            {value
                                ? (selected ?? t("controls.current"))
                                : t("controls.choose")}
                        </span>
                        <ChevronsUpDown className="shrink-0" />
                    </Button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content
                        sideOffset={4}
                        collisionPadding={12}
                        align="start"
                        className="gw-lookup gw-popover"
                    >
                        <Command shouldFilter={false} label={label}>
                            <div className="flex items-center gap-2 border-b p-2">
                                <Search size={16} />
                                <Command.Input
                                    aria-label={
                                        t("controls.search") + " " + label
                                    }
                                    value={search}
                                    onValueChange={(q) => {
                                        setSearch(q);
                                        setPage(1);
                                    }}
                                    placeholder={t("controls.search")}
                                    className="min-w-0 flex-1 bg-transparent p-1 outline-none"
                                />
                            </div>
                            <Command.List className="max-h-52 overflow-y-auto p-1">
                                {!required && value && (
                                    <Command.Item
                                        value="__clear__"
                                        onSelect={() => choose("", "")}
                                    >
                                        {t("controls.clear")}
                                    </Command.Item>
                                )}
                                {data?.data.map((item) => (
                                    <Command.Item
                                        key={item.id}
                                        value={item.id}
                                        onSelect={() =>
                                            choose(item.id, describe(item))
                                        }
                                    >
                                        {renderOption
                                            ? renderOption(item)
                                            : describe(item)}
                                        {value === item.id && (
                                            <Check size={16} />
                                        )}
                                    </Command.Item>
                                ))}
                                {!error && (
                                    <Command.Empty className="p-3 text-sm">
                                        {isValidating
                                            ? t("controls.loading")
                                            : t("controls.noResults")}
                                    </Command.Empty>
                                )}
                            </Command.List>
                        </Command>
                        {error && (
                            <div className="p-2">
                                <ErrorNotice error={error} />
                                <Button
                                    size="sm"
                                    type="button"
                                    variant="outline"
                                    onClick={() => void mutate()}
                                >
                                    {t("controls.retry")}
                                </Button>
                            </div>
                        )}
                        {(page > 1 || data?.metadata.nextPage) && (
                            <div className="flex items-center justify-between border-t p-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={page === 1 || isValidating}
                                    onClick={() => setPage(page - 1)}
                                >
                                    {t("controls.prev")}
                                </Button>
                                <span>{page}</span>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={
                                        !data?.metadata.nextPage || isValidating
                                    }
                                    onClick={() => setPage(page + 1)}
                                >
                                    {t("controls.next")}
                                </Button>
                            </div>
                        )}
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
            {required && (
                <input
                    tabIndex={-1}
                    className="sr-only"
                    aria-hidden="true"
                    value={value}
                    onChange={() => {}}
                    required
                    disabled={disabled}
                    onInvalid={(event) => {
                        event.preventDefault();
                        setInvalid(true);
                        document.getElementById(id)?.focus();
                    }}
                />
            )}
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
