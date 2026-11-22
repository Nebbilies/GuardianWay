"use client";
import { ListPage } from "@/components/custom/list-page";
import { DataTable } from "@/components/custom/data-table";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useState } from "react";
import useSWR from "swr";
import { Input } from "@/components/ui/input";
import { PagedLookup } from "@/components/custom/paged-lookup";
import { schoolApi } from "@/modules/system/schools/contracts";
import { listAudit } from "./contracts";
const actions = [
    "auth.login",
    "auth.login_failed",
    "auth.rate_limited",
    "school.created",
    "school.update",
    "school.delete",
    "school.restore",
    "account.created",
    "account.update",
    "account.delete",
    "account.restore",
    "account.activated",
    "vehicle.created",
    "vehicle.update",
    "stop.created",
    "student.created",
    "student.delete",
    "guardian.created",
    "guardian.closed",
    "card.assigned",
    "card.revoked",
    "policy.approved",
    "plan.approved",
    "schedule.activate",
    "trip.prepared",
    "trip.preparation_updated",
    "trip.cancelled",
];
export function AuditPage({ platform = false }: { platform?: boolean }) {
    const [action, setAction] = useState(""),
        [targetId, setTargetId] = useState(""),
        [schoolId, setSchoolId] = useState(""),
        [page, setPage] = useState(1);
    const { data, error, mutate, isValidating } = useSWR(
        ["audit", platform, action, targetId, schoolId, page],
        () =>
            listAudit({
                action: action || undefined,
                targetId: targetId.trim() || undefined,
                schoolId: platform ? schoolId || undefined : undefined,
                page,
            }),
    );
    return (
        <ListPage title={<>Nhật ký {platform ? "nền tảng" : "trường"}</>}>
            <div className="gw-filters">
                <ChoiceField
                    aria-label="Hành động"
                    value={action}
                    onValueChange={(value) => {
                        setAction(value);
                        setPage(1);
                    }}
                >
                    <Choice value="">Tất cả hành động</Choice>
                    {actions.map((value) => (
                        <Choice key={value} value={value}>
                            {value}
                        </Choice>
                    ))}
                </ChoiceField>
                <Input
                    aria-label="Mã đối tượng"
                    placeholder="Mã đối tượng..."
                    className="max-w-sm"
                    value={targetId}
                    onChange={(event) => {
                        setTargetId(event.target.value);
                        setPage(1);
                    }}
                />
            </div>
            {platform ? (
                <div className="max-w-md">
                    <PagedLookup
                        cacheKey="audit-schools"
                        label="Trường đích (tùy chọn)"
                        value={schoolId}
                        onChange={(id) => {
                            setSchoolId(id);
                            setPage(1);
                        }}
                        load={(query) =>
                            schoolApi.list({ ...query, deleted: "include" })
                        }
                        describe={(row) => row.code + " · " + row.name}
                    />
                </div>
            ) : null}
            <DataTable
                label="Nhật ký"
                empty="Chưa có nhật ký."
                rows={data?.data}
                error={error}
                refreshing={isValidating}
                retry={() => void mutate()}
                pagination={data?.metadata}
                onPage={setPage}
                pageSize={10}
                clearFilters={
                    action || targetId || schoolId
                        ? () => {
                              setAction("");
                              setTargetId("");
                              setSchoolId("");
                              setPage(1);
                          }
                        : undefined
                }
                columns={[
                    {
                        header: "Thời điểm",
                        cell: (row) => (
                            <>{new Date(row.occurredAt).toLocaleString()}</>
                        ),
                    },
                    {
                        header: "Hành động / người thao tác",
                        cell: (row) => (
                            <>
                                {row.action}
                                <p className="text-muted-foreground">
                                    {row.changeSummary.actor
                                        ? row.changeSummary.actor.role +
                                          " · " +
                                          row.changeSummary.actor.id.slice(0, 8)
                                        : "Không đăng nhập"}
                                </p>
                            </>
                        ),
                    },
                    {
                        header: "Đối tượng",
                        cell: (row) => (
                            <>
                                {row.subjectKind}
                                <p className="break-all text-xs text-muted-foreground">
                                    {row.subjectReference}
                                </p>
                            </>
                        ),
                    },
                    {
                        header: "Thay đổi",
                        cell: (row) => (
                            <>
                                {row.reason ? <p>{row.reason}</p> : null}
                                <details>
                                    <summary className="cursor-pointer">
                                        Chi tiết trước / sau
                                    </summary>
                                    <pre className="mt-2 max-w-xl overflow-auto whitespace-pre-wrap break-all rounded bg-muted/30 p-3 text-xs">
                                        {JSON.stringify(
                                            {
                                                before: row.changeSummary
                                                    .before,
                                                after: row.changeSummary.after,
                                            },
                                            null,
                                            2,
                                        )}
                                    </pre>
                                </details>
                            </>
                        ),
                    },
                ]}
            />
        </ListPage>
    );
}
