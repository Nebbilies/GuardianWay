"use client";
import { ListPage } from "@/components/custom/list-page";
import { useConfirmAction } from "@/components/custom/confirm-action";
import { RecordStatus } from "@/components/custom/record-status";
import { DataTable } from "@/components/custom/data-table";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormDialog } from "@/components/custom/form-dialog";
import { getErrorMessage } from "@/lib/i18n";
import { planApi, type Plan } from "./contracts";
import { PlanForm } from "./form";
export function PlansPage() {
  const { confirm, dialog } = useConfirmAction();
  const [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    [editing, setEditing] = useState<Plan>(),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false);
  const { data, error, isValidating, mutate } = useSWR(
    ["plans", page, status],
    () => planApi.list({ page, status }),
  );
  async function submit(input: unknown) {
    setBusy(true);
    try {
      if (editing?.status === "DRAFT") await planApi.update(editing.id, input);
      else await planApi.create(input, editing?.id);
      await mutate();
      setOpen(false);
      toast.success("Đã lưu bản nháp phương án.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function approve(plan: Plan) {
    setBusy(true);
    try {
      await planApi.approve(plan.id);
      await mutate();
      toast.success("Đã duyệt phương án.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <ListPage
      title={<>Phương án tuyến</>}
      actions={
        <Button
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          Thêm phương án
        </Button>
      }
    >
      <div className="gw-filters">
        <ChoiceField
          aria-label="Trạng thái phương án"
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <Choice value="">Tất cả trạng thái</Choice>
          <Choice value="DRAFT">Bản nháp</Choice>
          <Choice value="APPROVED">Đã duyệt</Choice>
        </ChoiceField>
        <Button variant="outline" asChild>
          <Link href="/admin/policies">Cấu hình vận tải</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/admin/schedules">Lịch định kỳ</Link>
        </Button>
      </div>
      <DataTable
        label="Phương án tuyến"
        empty="Chưa có phương án tuyến."
        rows={data?.data}
        error={error}
        refreshing={isValidating}
        retry={() => void mutate()}
        pagination={data?.metadata}
        onPage={setPage}
        pageSize={10}
        clearFilters={
          status
            ? () => {
                setStatus("");
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
            Thêm phương án
          </Button>
        }
        columns={[
          { header: "Phiên bản", cell: (plan) => plan.versionNo },
          {
            header: "Chiều",
            cell: (plan) => (plan.direction === "PICKUP" ? "Đón" : "Trả"),
          },
          {
            header: "Thời hạn",
            cell: (plan) => (
              <>
                {plan.effectiveFrom}
                <small>{plan.effectiveTo ?? "Không giới hạn"}</small>
              </>
            ),
          },
          { header: "Tham chiếu", cell: (plan) => plan.referenceDate },
          {
            header: "Các tuyến",
            cell: (plan) => (
              <details>
                <summary>{plan.routes.length} tuyến</summary>
                {plan.routes.map((route) => (
                  <div
                    key={route.id}
                    className="rounded-md bg-muted/30 p-3 text-sm"
                  >
                    <h3 className="font-medium">
                      {route.routeCode} · {route.label}
                    </h3>
                    <p className="text-muted-foreground">
                      Sức chứa khi lập tuyến: {route.capacitySnapshot} học sinh.
                      Ước tính nhập tay: {route.distanceMetres} mét /{" "}
                      {route.durationSeconds} giây
                    </p>
                    <ol className="mt-2 space-y-1">
                      {route.stops.map((stop) => (
                        <li key={stop.id}>
                          {stop.sequenceNo}. {stop.stopSnapshot.code} ·{" "}
                          {stop.stopSnapshot.name} — {stop.plannedTime}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </details>
            ),
          },
          {
            header: "Trạng thái",
            cell: (plan) => <RecordStatus value={plan.status} />,
          },
          {
            header: "Thao tác",
            cell: (plan) => (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    setEditing(plan);
                    setOpen(true);
                  }}
                >
                  {plan.status === "DRAFT"
                    ? "Sửa bản nháp"
                    : "Tạo phiên bản mới"}
                </Button>
                {plan.status === "DRAFT" ? (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      confirm({
                        title: "Duyệt phương án v" + plan.versionNo,
                        description:
                          "Duyệt phương án thủ công? Bản đã duyệt được điều chỉnh bằng phiên bản mới.",
                        action: "Duyệt",
                        destructive: false,
                        run: () => approve(plan),
                      })
                    }
                  >
                    Duyệt
                  </Button>
                ) : null}
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
        title={
          editing?.status === "APPROVED"
            ? "Tạo phiên bản phương án mới"
            : "Phương án thủ công"
        }
      >
        <PlanForm
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
