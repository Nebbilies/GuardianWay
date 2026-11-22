"use client";
import { ListPage } from "@/components/custom/list-page";
import { RecordStatus } from "@/components/custom/record-status";
import { DataTable } from "@/components/custom/data-table";
import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/custom/form-dialog";
import { getErrorMessage } from "@/lib/i18n";
import { scheduleApi, type Schedule } from "./contracts";
import { ScheduleForm } from "./form";
export function SchedulesPage() {
    const [page, setPage] = useState(1),
        [editing, setEditing] = useState<Schedule>(),
        [open, setOpen] = useState(false),
        [busy, setBusy] = useState(false);
    const { data, error, isValidating, mutate } = useSWR(
        ["schedules", page],
        () => scheduleApi.list({ page }),
    );
    async function submit(input: unknown) {
        setBusy(true);
        try {
            if (editing?.status === "DRAFT")
                await scheduleApi.update(editing.id, input);
            else await scheduleApi.create(input, editing?.id);
            await mutate();
            setOpen(false);
            toast.success("Đã lưu bản nháp lịch.");
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    }
    async function transition(row: Schedule) {
        setBusy(true);
        try {
            if (row.status === "ACTIVE") await scheduleApi.deactivate(row.id);
            else await scheduleApi.activate(row.id);
            await mutate();
            toast.success("Đã cập nhật trạng thái lịch.");
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    }
    return (
        <ListPage
            title={<>Lịch định kỳ</>}
            actions={
                <Button
                    onClick={() => {
                        setEditing(undefined);
                        setOpen(true);
                    }}
                >
                    Thêm lịch
                </Button>
            }
        >
            <DataTable
                label="Lịch định kỳ"
                empty="Chưa có lịch định kỳ."
                rows={data?.data}
                error={error}
                refreshing={isValidating}
                retry={() => void mutate()}
                pagination={data?.metadata}
                onPage={setPage}
                pageSize={10}
                emptyAction={
                    <Button
                        onClick={() => {
                            setEditing(undefined);
                            setOpen(true);
                        }}
                    >
                        Thêm lịch
                    </Button>
                }
                columns={[
                    { header: "Tuyến", cell: (row) => row.routeLabel },
                    { header: "Phiên bản", cell: (row) => row.versionNo },
                    {
                        header: "Chiều",
                        cell: (row) =>
                            row.direction === "PICKUP" ? "Đón" : "Trả",
                    },
                    {
                        header: "Lịch chạy",
                        cell: (row) => (
                            <>
                                {row.plannedStartTime}
                                <small>
                                    {row.weekdays
                                        .map((d) =>
                                            d === 7 ? "CN" : "T" + (d + 1),
                                        )
                                        .join(", ")}
                                </small>
                            </>
                        ),
                    },
                    {
                        header: "Hiệu lực",
                        cell: (row) => (
                            <>
                                {row.effectiveFrom}
                                <small>
                                    {row.effectiveTo ?? "Không giới hạn"}
                                </small>
                            </>
                        ),
                    },
                    {
                        header: "Trạng thái",
                        cell: (row) => <RecordStatus value={row.status} />,
                    },
                    {
                        header: "Thao tác",
                        cell: (row) => (
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => {
                                        setEditing(row);
                                        setOpen(true);
                                    }}
                                >
                                    {row.status === "DRAFT"
                                        ? "Sửa bản nháp"
                                        : "Tạo phiên bản mới"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => void transition(row)}
                                >
                                    {row.status === "ACTIVE"
                                        ? "Ngừng áp dụng"
                                        : "Áp dụng"}
                                </Button>
                            </div>
                        ),
                    },
                ]}
            />
            <FormDialog
                busy={busy}
                size="xl"
                isOpen={open}
                onClose={() => setOpen(false)}
                title="Lịch định kỳ"
            >
                <ScheduleForm
                    key={editing?.id ?? "new"}
                    initialData={editing}
                    busy={busy}
                    onSubmit={submit}
                    onCancel={() => setOpen(false)}
                />
            </FormDialog>
        </ListPage>
    );
}
