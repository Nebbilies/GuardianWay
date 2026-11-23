"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowLeft, MapPin, TriangleAlert } from "lucide-react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { ListPage } from "@/components/custom/list-page";
import { ErrorNotice } from "@/components/error-notice";
import type { Stop } from "@/modules/planning/stops/contracts";
import { loadCatalogue } from "./demo";
import { ApproveDialog, RejectDialog, SplitDaysDialog } from "./dialogs";
import { registrationsByStatusPath, reviewStopCataloguePath } from "./paths";
import { PointLookup } from "./point-lookup";
import {
    directionLabels,
    displayDays,
    instantLabel,
    period,
    StatusBadge,
    weekdayDateLabel,
} from "./presentation";
import {
    assessReview,
    ReviewError,
    type DayGroup,
    type Draft,
    type ReviewRegistration,
} from "./review";

type Decision =
    { kind: "approve"; stops: Stop[] } | { kind: "reject"; reason: string };
type Modal =
    { kind: "approve" | "reject" } | { kind: "split"; group: DayGroup };
const noStops: Stop[] = [];
const directions = ["PICKUP", "DROPOFF"] as const;

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words text-sm font-semibold">
                {children}
            </dd>
        </div>
    );
}

function ReadOnlyPoint({ label, name }: { label: string; name?: string }) {
    return (
        <div className="grid gap-1.5">
            <p className="text-xs font-semibold">{label}</p>
            <p className="flex min-h-10 items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-medium">
                <MapPin className="size-4 shrink-0" />
                {name ?? "—"}
            </p>
        </div>
    );
}

function PointGroup({
    group,
    status,
    catalogue,
    schoolId,
    canAssign,
    onAssign,
    onSplit,
}: {
    group: DayGroup;
    status: ReviewRegistration["status"];
    catalogue: Stop[];
    schoolId: string;
    canAssign: boolean;
    onAssign: (pointId: string | null) => void;
    onSplit: () => void;
}) {
    const byAddress = Map.groupBy(
        group.days.filter((day) => day.requestedAddress),
        (day) => day.requestedAddress!,
    );
    return (
        <div className="grid min-w-0 gap-2">
            <p className="break-words text-sm font-semibold">
                {group.days.length === 1
                    ? weekdayDateLabel(group.days[0].serviceDate)
                    : displayDays(group.days)}
            </p>
            <ReadOnlyPoint
                label="Điểm mong muốn"
                name={group.requestedStop?.name}
            />
            {byAddress.size > 0 && (
                <dl className="space-y-2">
                    {[...byAddress].map(([address, days]) => (
                        <Field
                            key={address}
                            label={
                                days.length === group.days.length
                                    ? "Địa chỉ bổ sung"
                                    : `Địa chỉ bổ sung ngày ${displayDays(days)}`
                            }
                        >
                            {address}
                        </Field>
                    ))}
                </dl>
            )}
            {status === "APPROVED" && (
                <ReadOnlyPoint
                    label="Điểm đã duyệt"
                    name={group.approvedStop?.name}
                />
            )}
            {canAssign && (
                <>
                    <PointLookup
                        label="Điểm gán"
                        direction={group.direction}
                        catalogue={catalogue}
                        schoolId={schoolId}
                        stop={group.assignedStop}
                        onChange={onAssign}
                    />
                    {group.days.length > 1 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="justify-self-start"
                            aria-label={`Chọn riêng theo ngày, ${directionLabels[group.direction].toLowerCase()}, ${displayDays(group.days)}`}
                            onClick={onSplit}
                        >
                            Chọn riêng theo ngày
                        </Button>
                    )}
                </>
            )}
        </div>
    );
}

function ReviewNotices({
    missing,
    conflicts,
    catalogue,
    registrationId,
}: {
    missing: ReviewRegistration["days"];
    conflicts: ReviewRegistration["days"];
    catalogue: Stop[];
    registrationId: string;
}) {
    const inactive =
        missing.length === 1 &&
        catalogue.some(
            (point) =>
                point.code === missing[0].requestedStop?.code &&
                point.status === "INACTIVE",
        );
    return (
        <>
            {conflicts.length > 0 && (
                <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
                >
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    <div className="min-w-0">
                        <p className="font-semibold">Trùng lịch đã duyệt</p>
                        {directions.map((direction) => {
                            const days = conflicts.filter(
                                (day) => day.direction === direction,
                            );
                            return (
                                days.length > 0 && (
                                    <p key={direction} className="break-words">
                                        {directionLabels[direction]} ngày{" "}
                                        {displayDays(days)}
                                    </p>
                                )
                            );
                        })}
                    </div>
                </div>
            )}
            {missing.length > 0 && (
                <div
                    role="status"
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-accent p-3 text-sm text-accent-foreground"
                >
                    <div className="flex min-w-0 items-start gap-2">
                        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                        <div className="min-w-0 font-semibold">
                            {directions.map((direction) => {
                                const days = missing.filter(
                                    (day) => day.direction === direction,
                                );
                                const label =
                                    direction === "PICKUP" ? "đón" : "trả";
                                return (
                                    days.length > 0 && (
                                        <p
                                            key={direction}
                                            className="break-words"
                                        >
                                            {inactive
                                                ? `Điểm ${label} ngày ${displayDays(days)} đã ngừng hoạt động`
                                                : `Cần gán điểm ${label} ngày ${displayDays(days)}`}
                                        </p>
                                    )
                                );
                            })}
                        </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={reviewStopCataloguePath(registrationId)}>
                            Mở danh mục điểm
                        </Link>
                    </Button>
                </div>
            )}
        </>
    );
}

function ActionError({ error }: { error: unknown }) {
    if (!error) return null;
    if (error instanceof ReviewError)
        return (
            <p role="alert" className="text-sm text-destructive">
                {error.message}
            </p>
        );
    if (error instanceof DOMException)
        return (
            <p role="alert" className="text-sm text-destructive">
                Không lưu được phiên demo trong tab này.
            </p>
        );
    return <ErrorNotice error={error} />;
}

export function ReviewDetails({
    registration,
    registrations,
    draft,
    schoolId,
    timezone,
    onAssign,
    onDecision,
}: {
    registration: ReviewRegistration;
    registrations: ReviewRegistration[];
    draft: Draft;
    schoolId: string;
    timezone: string;
    onAssign: (days: DayGroup["days"], stopId: string | null) => void;
    onDecision: (decision: Decision) => void;
}) {
    const [modal, setModal] = useState<Modal | null>(null);
    const [error, setError] = useState<unknown>(null);
    const [busy, setBusy] = useState(false);
    const pending = registration.status === "PENDING";
    const catalogue = useSWR(
        pending ? ["registration-review-catalogue", schoolId] : null,
        () => loadCatalogue(schoolId),
        // Returning from the stop catalogue must revalidate even during a quick round trip.
        { revalidateOnMount: true, dedupingInterval: 0 },
    );
    const canAssign = pending && !!catalogue.data && !catalogue.error;
    const stops = catalogue.data ?? noStops;
    const review = assessReview(registration, draft, stops, registrations);
    const { groups, missing, conflicts, assignments } = review;
    const canApprove =
        canAssign &&
        assignments.size > 0 &&
        !missing.length &&
        !conflicts.length;

    function open(next: Modal | null) {
        setError(null);
        setModal(next);
    }
    function assign(days: DayGroup["days"], stopId: string | null) {
        try {
            onAssign(days, stopId);
            open(null);
        } catch (error) {
            setError(error);
        }
    }
    async function approve() {
        if (busy || !canApprove) return;
        setBusy(true);
        setError(null);
        try {
            const fresh = await loadCatalogue(schoolId);
            await catalogue.mutate(fresh, { revalidate: false });
            const refreshed = assessReview(
                registration,
                draft,
                fresh,
                registrations,
            );
            if (
                !refreshed.missing.length &&
                [...assignments].some(([key, stop]) => {
                    const updated = refreshed.assignments.get(key);
                    return (
                        updated?.id !== stop.id || updated.name !== stop.name
                    );
                })
            )
                throw new ReviewError(
                    "Danh mục điểm đã thay đổi. Kiểm tra và xác nhận lại.",
                );
            onDecision({ kind: "approve", stops: fresh });
            open(null);
        } catch (error) {
            setError(error);
        } finally {
            setBusy(false);
        }
    }
    function reject(reason: string) {
        try {
            onDecision({ kind: "reject", reason });
            open(null);
        } catch (error) {
            setError(error);
        }
    }

    return (
        <ListPage>
            <div className="space-y-4">
                <Button variant="ghost" size="sm" className="px-1" asChild>
                    <Link href={registrationsByStatusPath(registration.status)}>
                        <ArrowLeft className="size-4" /> Đăng ký xe
                    </Link>
                </Button>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold">
                        {registration.student.name}
                    </h1>
                    <StatusBadge status={registration.status} />
                </div>
                <dl className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Field label="Mã học sinh">
                        {registration.student.code}
                    </Field>
                    <Field label="Phụ huynh gửi">
                        {registration.submittedBy}
                    </Field>
                    <Field label="Phạm vi đăng ký">
                        {period(registration.days)}
                    </Field>
                    <Field label="Thời điểm gửi">
                        {instantLabel(registration.submittedAt, timezone)}
                    </Field>
                </dl>
                {registration.review && (
                    <section className="space-y-2 rounded-lg border bg-card p-4">
                        <h2 className="text-sm font-bold">
                            {registration.status === "APPROVED"
                                ? "Đã duyệt đăng ký"
                                : "Đã từ chối đăng ký"}
                        </h2>
                        <dl className="grid gap-3 sm:grid-cols-[minmax(10rem,auto)_1fr]">
                            <Field label="Người xử lý">
                                {registration.review.reviewer}
                            </Field>
                            <Field label="Thời điểm xử lý">
                                {instantLabel(
                                    registration.review.reviewedAt,
                                    timezone,
                                )}
                            </Field>
                            {registration.reviewNote && (
                                <Field label="Lý do từ chối">
                                    {registration.reviewNote}
                                </Field>
                            )}
                        </dl>
                    </section>
                )}
                {pending && catalogue.error && (
                    <div className="space-y-2">
                        <ErrorNotice error={catalogue.error} />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void catalogue.mutate()}
                        >
                            Tải lại danh mục điểm
                        </Button>
                    </div>
                )}
                {pending && catalogue.isLoading && (
                    <p role="status">Đang tải danh mục điểm…</p>
                )}
                {pending && (
                    <ReviewNotices
                        missing={canAssign ? missing : []}
                        conflicts={conflicts}
                        catalogue={stops}
                        registrationId={registration.id}
                    />
                )}
                <h2 className="text-xl font-bold">Lịch và điểm đón/trả</h2>
                <div className="grid items-start gap-4 md:grid-cols-2">
                    {directions.map((direction) => {
                        const sameDirection = groups.filter(
                            (group) => group.direction === direction,
                        );
                        if (!sameDirection.length) return null;
                        return (
                            <section
                                key={direction}
                                className="min-w-0 divide-y rounded-lg border bg-card p-4"
                            >
                                <header className="flex justify-between gap-3 pb-3">
                                    <h3 className="font-bold">
                                        {directionLabels[direction]}
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        {sameDirection.reduce(
                                            (count, group) =>
                                                count + group.days.length,
                                            0,
                                        )}{" "}
                                        ngày
                                    </span>
                                </header>
                                {sameDirection.map((group) => (
                                    <div
                                        key={group.key}
                                        className="py-3 last:pb-0"
                                    >
                                        <PointGroup
                                            group={group}
                                            status={registration.status}
                                            catalogue={stops}
                                            schoolId={schoolId}
                                            canAssign={canAssign}
                                            onAssign={(id) =>
                                                assign(group.days, id)
                                            }
                                            onSplit={() =>
                                                open({ kind: "split", group })
                                            }
                                        />
                                    </div>
                                ))}
                            </section>
                        );
                    })}
                </div>
                {pending && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3">
                        <span
                            role="status"
                            className={`text-sm font-medium ${canApprove ? "text-[var(--positive-ink)]" : ""}`}
                        >
                            {conflicts.length
                                ? `Có ${conflicts.length} lượt trùng với đăng ký đã duyệt`
                                : canAssign
                                  ? `Đã gán điểm cho ${assignments.size}/${registration.days.length} lượt`
                                  : "Đang chờ danh mục điểm"}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="text-destructive"
                                onClick={() => open({ kind: "reject" })}
                            >
                                Từ chối
                            </Button>
                            <Button
                                disabled={!canApprove}
                                onClick={() => open({ kind: "approve" })}
                            >
                                Duyệt đơn
                            </Button>
                        </div>
                    </div>
                )}
                {(!modal || modal.kind === "split") && (
                    <ActionError error={error} />
                )}
            </div>
            {pending && modal?.kind === "split" && (
                <SplitDaysDialog
                    group={modal.group}
                    catalogue={stops}
                    schoolId={schoolId}
                    onApply={assign}
                    onClose={() => open(null)}
                />
            )}
            {pending && modal?.kind === "approve" && (
                <ApproveDialog
                    student={registration.student.name}
                    groups={groups}
                    busy={busy}
                    error={<ActionError error={error} />}
                    onConfirm={() => void approve()}
                    onClose={() => open(null)}
                />
            )}
            {pending && modal?.kind === "reject" && (
                <RejectDialog
                    error={<ActionError error={error} />}
                    onConfirm={reject}
                    onClose={() => open(null)}
                />
            )}
        </ListPage>
    );
}
