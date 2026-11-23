import { useState, type ReactNode } from "react";
import { FormDialog } from "@/components/custom/form-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { directionLabels, displayDays, weekdayDateLabel } from "./presentation";
import { PointLookup } from "./point-lookup";
import { eligibleStop, type DayGroup } from "./review";
import type { Stop } from "@/modules/planning/stops/contracts";

function Actions({
    children,
    onClose,
    busy,
}: {
    children: ReactNode;
    onClose: () => void;
    busy?: boolean;
}) {
    return (
        <div className="gw-form-actions">
            <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={busy}
            >
                Hủy
            </Button>
            {children}
        </div>
    );
}

export function SplitDaysDialog({
    group,
    catalogue,
    schoolId,
    onApply,
    onClose,
}: {
    group: DayGroup;
    catalogue: Stop[];
    schoolId: string;
    onApply: (days: DayGroup["days"], stopId: string) => void;
    onClose: () => void;
}) {
    const [dates, setDates] = useState<string[]>([]);
    const [pointId, setPointId] = useState<string | null>(null);
    const selected =
        catalogue.find(
            (point) =>
                point.id === pointId && eligibleStop(point, group.direction),
        ) ?? null;
    const days = group.days.filter((day) => dates.includes(day.serviceDate));

    return (
        <FormDialog
            isOpen
            title="Chọn riêng theo ngày"
            onClose={onClose}
            size="sm"
        >
            <form
                className="gw-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (days.length && selected) onApply(days, selected.id);
                }}
            >
                <div className="gw-form-fields">
                    <fieldset className="min-w-0">
                        <legend className="mb-2 text-sm font-semibold">
                            Ngày áp dụng cho{" "}
                            {directionLabels[group.direction].toLowerCase()}
                        </legend>
                        <div className="max-h-56 space-y-1 overflow-y-auto rounded-md bg-muted p-2">
                            {group.days.map(({ serviceDate }) => (
                                <label
                                    key={serviceDate}
                                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-card"
                                >
                                    <input
                                        className="size-4 accent-primary"
                                        type="checkbox"
                                        checked={dates.includes(serviceDate)}
                                        onChange={(event) =>
                                            setDates((current) =>
                                                event.target.checked
                                                    ? [...current, serviceDate]
                                                    : current.filter(
                                                          (date) =>
                                                              date !==
                                                              serviceDate,
                                                      ),
                                            )
                                        }
                                    />
                                    {weekdayDateLabel(serviceDate)}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                    <PointLookup
                        label="Điểm cho ngày đã chọn"
                        direction={group.direction}
                        catalogue={catalogue}
                        schoolId={schoolId}
                        stop={selected}
                        onChange={setPointId}
                    />
                </div>
                <Actions onClose={onClose}>
                    <Button type="submit" disabled={!days.length || !selected}>
                        Áp dụng
                    </Button>
                </Actions>
            </form>
        </FormDialog>
    );
}

export function ApproveDialog({
    student,
    groups,
    busy,
    error,
    onConfirm,
    onClose,
}: {
    student: string;
    groups: DayGroup[];
    busy: boolean;
    error: ReactNode;
    onConfirm: () => void;
    onClose: () => void;
}) {
    return (
        <FormDialog
            isOpen
            title="Xác nhận duyệt đơn"
            onClose={onClose}
            size="sm"
            busy={busy}
        >
            <div className="gw-form">
                <div className="gw-form-fields">
                    <dl className="max-h-56 space-y-2 overflow-auto rounded-md bg-muted p-3 text-sm">
                        <div className="flex justify-between gap-3">
                            <dt className="font-semibold">Học sinh</dt>
                            <dd>{student}</dd>
                        </div>
                        {groups.map((group) => (
                            <div
                                key={group.key}
                                className="flex justify-between gap-3"
                            >
                                <dt className="min-w-0 break-words font-semibold">
                                    {directionLabels[group.direction]}
                                    {groups.some(
                                        (other) =>
                                            other !== group &&
                                            other.direction === group.direction,
                                    )
                                        ? `, ${displayDays(group.days)}`
                                        : ` (${group.days.length} ngày)`}
                                </dt>
                                <dd className="max-w-1/2 break-words text-right">
                                    {group.assignedStop?.name ??
                                        "Chưa gán điểm"}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    {error}
                </div>
                <Actions onClose={onClose} busy={busy}>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={
                            busy || groups.some((group) => !group.assignedStop)
                        }
                    >
                        {busy ? "Đang kiểm tra…" : "Xác nhận duyệt"}
                    </Button>
                </Actions>
            </div>
        </FormDialog>
    );
}

export function RejectDialog({
    error,
    onConfirm,
    onClose,
}: {
    error: ReactNode;
    onConfirm: (reason: string) => void;
    onClose: () => void;
}) {
    const [reason, setReason] = useState("");
    return (
        <FormDialog isOpen title="Từ chối đăng ký" onClose={onClose} size="sm">
            <form
                className="gw-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (reason.trim()) onConfirm(reason);
                }}
            >
                <div className="gw-form-fields">
                    <div className="grid gap-2">
                        <Label htmlFor="registration-review-reason">
                            Lý do{" "}
                            <span
                                aria-hidden="true"
                                className="text-destructive"
                            >
                                *
                            </span>
                        </Label>
                        <Textarea
                            id="registration-review-reason"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            required
                        />
                    </div>
                    {error}
                </div>
                <Actions onClose={onClose}>
                    <Button
                        variant="destructive"
                        type="submit"
                        disabled={!reason.trim()}
                    >
                        Xác nhận từ chối
                    </Button>
                </Actions>
            </form>
        </FormDialog>
    );
}
