"use client";

import Link from "next/link";
import { useState } from "react";
import { Search } from "lucide-react";
import { DataTable } from "@/components/custom/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    instantLabel,
    period,
    StatusBadge,
    statusLabels,
} from "./presentation";
import { registrationDetailPath } from "./paths";
import { paginate, searchText, type ReviewRegistration } from "./review";

type Status = ReviewRegistration["status"];
const filters: Status[] = ["PENDING", "APPROVED", "REJECTED"];
const pageSize = 10;

export function ReviewList({
    registrations,
    initialStatus,
    timezone,
}: {
    registrations: ReviewRegistration[];
    initialStatus: Status;
    timezone: string;
}) {
    const [status, setStatus] = useState(initialStatus);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const term = searchText(search);
    const results = registrations
        .filter(
            (row) =>
                row.status === status &&
                (!term ||
                    searchText(row.student.name).includes(term) ||
                    searchText(row.student.code).includes(term)),
        )
        .sort(
            (a, b) =>
                Date.parse(b.submittedAt) - Date.parse(a.submittedAt) ||
                a.id.localeCompare(b.id),
        );
    const { data, metadata } = paginate(results, page, pageSize);

    return (
        <div className="gw-page pt-6">
            <h1>Đăng ký xe</h1>
            <div className="gw-filters justify-between">
                <div
                    role="group"
                    aria-label="Lọc trạng thái"
                    className="flex w-fit gap-1 rounded-md border bg-muted p-1"
                >
                    {filters.map((value) => (
                        <Button
                            key={value}
                            size="sm"
                            type="button"
                            variant={status === value ? "outline" : "ghost"}
                            aria-pressed={status === value}
                            className={cn(
                                status === value
                                    ? "bg-card"
                                    : "text-muted-foreground",
                            )}
                            onClick={() => {
                                setStatus(value);
                                setPage(1);
                            }}
                        >
                            {statusLabels[value]}
                        </Button>
                    ))}
                </div>
                <div className="relative w-full max-w-xs">
                    <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                        className="bg-card pl-9"
                        aria-label="Tìm theo tên hoặc mã học sinh"
                        placeholder="Tìm theo tên hoặc mã học sinh"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>
            <DataTable
                label="Danh sách đăng ký xe"
                rows={data}
                pagination={metadata}
                onPage={setPage}
                pageSize={pageSize}
                retry={() => {}}
                empty={
                    term
                        ? "Không tìm thấy đăng ký."
                        : status === "PENDING"
                          ? "Không có đăng ký chờ duyệt."
                          : "Không có đăng ký trong trạng thái này."
                }
                clearFilters={
                    term
                        ? () => {
                              setSearch("");
                              setPage(1);
                          }
                        : undefined
                }
                columns={[
                    {
                        header: "Học sinh",
                        cell: (row) => (
                            <div className="flex flex-col gap-0.5">
                                <span className="font-semibold">
                                    {row.student.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {row.student.code}
                                </span>
                            </div>
                        ),
                    },
                    {
                        header: "Ngày phục vụ",
                        cell: (row) => (
                            <span className="whitespace-nowrap">
                                {period(row.days)}
                            </span>
                        ),
                    },
                    {
                        header: "Trạng thái",
                        cell: (row) => <StatusBadge status={row.status} />,
                    },
                    {
                        header: "Ngày gửi",
                        cell: (row) => (
                            <span className="whitespace-nowrap">
                                {instantLabel(row.submittedAt, timezone)}
                            </span>
                        ),
                    },
                    {
                        header: "Thao tác",
                        cell: (row) => (
                            <Button variant="outline" size="sm" asChild>
                                <Link
                                    href={registrationDetailPath(row.id)}
                                    aria-label={`Xem chi tiết đăng ký của ${row.student.name}`}
                                >
                                    Xem chi tiết
                                </Link>
                            </Button>
                        ),
                    },
                ]}
            />
        </div>
    );
}
