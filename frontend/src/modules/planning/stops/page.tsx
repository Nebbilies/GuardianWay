"use client";
import { ListPage } from "@/components/custom/list-page";
import { useConfirmAction } from "@/components/custom/confirm-action";
import { RecordStatus } from "@/components/custom/record-status";
import { DataTable } from "@/components/custom/data-table";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/i18n";
import { FormDialog } from "@/components/custom/form-dialog";
import { stopApi, type Stop } from "./contracts";
import { StopForm } from "./form";
import Link from "next/link";
import { registrationDetailPath } from "@/modules/transport/registration-review/paths";

export function StopPage({ reviewId }: { reviewId?: string }) {
    const { mutate: mutateCache } = useSWRConfig();
    const { confirm, dialog } = useConfirmAction();
    const [search, setSearch] = useState(""),
        [page, setPage] = useState(1),
        [deleted, setDeleted] = useState<"exclude" | "only">("exclude"),
        [sort, setSort] = useState("-createdAt");
    const [kind, setKind] = useState<Stop["kind"]>();
    const [editing, setEditing] = useState<Stop>(),
        [open, setOpen] = useState(false),
        [busy, setBusy] = useState(false);
    const { data, error, isValidating, mutate } = useSWR(
        ["stop", search, page, deleted, sort, kind],
        () => stopApi.list({ search, page, deleted, sort, kind }),
    );
    async function submit(input: unknown) {
        setBusy(true);
        try {
            if (editing) await stopApi.update(editing.id, input);
            else await stopApi.create(input);
            await mutateCache(
                (key) => Array.isArray(key) && key[0] === "stop",
                undefined,
            );
            setOpen(false);
            toast.success("Đã lưu dữ liệu.");
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    }
    async function lifecycle(row: Stop) {
        setBusy(true);
        try {
            if (row.deletedAt) await stopApi.restore(row.id);
            else await stopApi.remove(row.id);
            await mutateCache(
                (key) => Array.isArray(key) && key[0] === "stop",
                undefined,
            );
            toast.success("Đã cập nhật hồ sơ.");
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setBusy(false);
        }
    }
    function changeSort(field: string) {
        setSort(sort === field ? "-" + field : field);
        setPage(1);
    }
    return (
        <ListPage
            title={<>Điểm đón/trả</>}
            actions={
                <Button
                    onClick={() => {
                        setEditing(undefined);
                        setOpen(true);
                    }}
                >
                    <Plus className="size-4" />
                    Thêm mới
                </Button>
            }
        >
            {reviewId && (
                <Button variant="ghost" size="sm" asChild>
                    <Link href={registrationDetailPath(reviewId)}>
                        <ArrowLeft className="size-4" />
                        Quay lại đơn đăng ký
                    </Link>
                </Button>
            )}
            <div className="gw-filters">
                <Input
                    aria-label="Tìm điểm"
                    placeholder="Tìm kiếm..."
                    className="max-w-sm"
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                    }}
                />
                <ChoiceField
                    aria-label="Loại điểm"
                    value={kind ?? ""}
                    onValueChange={(value) => {
                        setKind(
                            value === "SCHOOL" || value === "SERVICE_POINT"
                                ? value
                                : undefined,
                        );
                        setPage(1);
                    }}
                >
                    <Choice value="">Tất cả loại điểm</Choice>
                    <Choice value="SCHOOL">Trường</Choice>
                    <Choice value="SERVICE_POINT">Điểm đón/trả</Choice>
                </ChoiceField>
                <ChoiceField
                    aria-label="Hồ sơ đã xóa"
                    value={deleted}
                    onValueChange={(value) => {
                        setDeleted(value === "only" ? "only" : "exclude");
                        setPage(1);
                    }}
                >
                    <Choice value="exclude">Chưa xóa</Choice>
                    <Choice value="only">Đã xóa</Choice>
                </ChoiceField>
            </div>
            <DataTable
                label="Điểm đón/trả"
                empty="Chưa có điểm đón/trả."
                rows={data?.data}
                error={error}
                refreshing={isValidating}
                retry={() => void mutate()}
                pagination={data?.metadata}
                onPage={setPage}
                pageSize={10}
                sort={sort}
                onSort={changeSort}
                clearFilters={
                    search || kind || deleted === "only"
                        ? () => {
                              setSearch("");
                              setKind(undefined);
                              setDeleted("exclude");
                              setPage(1);
                          }
                        : undefined
                }
                emptyAction={
                    <Button
                        onClick={() => {
                            setEditing(undefined);
                            setOpen(true);
                        }}
                    >
                        <Plus className="size-4" />
                        Thêm mới
                    </Button>
                }
                columns={[
                    {
                        header: "Mã điểm",
                        sortKey: "code",
                        cell: (row) => row.code ?? "—",
                    },
                    {
                        header: "Tên điểm",
                        sortKey: "name",
                        cell: (row) => row.name ?? "—",
                    },
                    { header: "Địa chỉ", cell: (row) => row.address ?? "—" },
                    {
                        header: "Loại điểm",
                        cell: (row) => (
                            <>
                                <>
                                    {row.kind === "SCHOOL"
                                        ? "Trường học"
                                        : "Điểm phục vụ"}
                                </>
                            </>
                        ),
                    },
                    {
                        header: "Trạng thái",
                        sortKey: "status",
                        cell: (row) => <RecordStatus value={row.status} />,
                    },
                    {
                        header: "Thao tác",
                        cell: (row) => (
                            <>
                                <div className="flex flex-wrap gap-2">
                                    {!row.deletedAt ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={busy}
                                            onClick={() => {
                                                setEditing(row);
                                                setOpen(true);
                                            }}
                                        >
                                            Sửa
                                        </Button>
                                    ) : null}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={busy}
                                        onClick={() =>
                                            confirm({
                                                title:
                                                    (row.deletedAt
                                                        ? "Khôi phục "
                                                        : "Xóa ") + row.name,
                                                description: row.deletedAt
                                                    ? "Khôi phục hồ sơ này?"
                                                    : "Xóa mềm hồ sơ này?",
                                                action: row.deletedAt
                                                    ? "Khôi phục"
                                                    : "Xóa",
                                                destructive: !row.deletedAt,
                                                run: () => lifecycle(row),
                                            })
                                        }
                                    >
                                        {row.deletedAt ? "Khôi phục" : "Xóa"}
                                    </Button>
                                </div>
                            </>
                        ),
                    },
                ]}
            />
            <FormDialog
                busy={busy}
                size="md"
                isOpen={open}
                onClose={() => setOpen(false)}
                title={editing ? "Sửa điểm" : "Thêm điểm"}
            >
                <StopForm
                    key={editing?.id ?? "new"}
                    initialData={editing}
                    busy={busy}
                    onSubmit={submit}
                    onCancel={() => setOpen(false)}
                />
            </FormDialog>
            {dialog}
        </ListPage>
    );
}
