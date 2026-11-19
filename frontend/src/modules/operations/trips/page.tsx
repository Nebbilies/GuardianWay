"use client";
import { ListPage } from "@/components/custom/list-page";
import { RecordStatus } from "@/components/custom/record-status";
import { DataTable } from "@/components/custom/data-table";
import { TemporalField } from "@/components/custom/temporal-field";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { ErrorNotice } from "@/components/error-notice";
import { FormDialog } from "@/components/custom/form-dialog";
import { getErrorMessage } from "@/lib/i18n";
import { getSchoolContext } from "@/modules/system/schools/contracts";
import { tripApi, type Trip } from "./contracts";
import { TripForm } from "./form";
function TripDetails({ id }: { id: string }) {
  const { data, error } = useSWR(["trip-detail", id], () => tripApi.get(id));
  const { data: school } = useSWR("school-context", getSchoolContext);
  const time = (value: string) =>
    school
      ? new Intl.DateTimeFormat("vi-VN", {
          timeZone: school.timezone,
          dateStyle: "short",
          timeStyle: "medium",
        }).format(new Date(value))
      : value;
  if (error) return <ErrorNotice error={error} />;
  if (!data) return <p>Đang tải…</p>;
  return (
    <div className="space-y-4 text-sm">
      <p>
        {data.serviceDate} · {data.direction} · {data.status} · Phiên bản dữ
        liệu {data.dataVersion}
      </p>
      <p>
        Xe dự kiến: {data.vehicleLabel ?? "Chưa phân công"} · Tài xế dự kiến:{" "}
        {data.driverLabel ?? "Chưa phân công"}
      </p>
      <ol className="space-y-2">
        {data.stops.map((stop) => (
          <li className="rounded-md border p-3" key={stop.id}>
            {stop.sequenceNo}. {stop.stopSnapshot.name} ·{" "}
            {stop.stopSnapshot.address}
            <p className="text-muted-foreground">
              {time(stop.plannedAt)} · v{stop.versionNo}
            </p>
          </li>
        ))}
      </ol>
      <details>
        <summary className="cursor-pointer font-medium">
          Lịch sử phiên bản giờ ghé điểm
        </summary>
        <ul className="mt-2 space-y-2">
          {data.stopHistory.map((stop) => (
            <li key={stop.id}>
              {stop.stopSnapshot.name} · v{stop.versionNo} ·{" "}
              {time(stop.plannedAt)} ·{" "}
              {stop.effectiveTo ? "Đã thay thế" : "Hiện hành"}
            </li>
          ))}
        </ul>
      </details>
      {data.cancellationReason ? (
        <p>Lý do hủy: {data.cancellationReason}</p>
      ) : null}
    </div>
  );
}
export function TripsPage() {
  const [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    [date, setDate] = useState(""),
    [editing, setEditing] = useState<Trip>(),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [cancel, setCancel] = useState<Trip>(),
    [detailId, setDetailId] = useState<string>();
  const { data, error, isValidating, mutate } = useSWR(
    ["trips", page, status, date],
    () => tripApi.list({ page, status, serviceDate: date || undefined }),
  );
  const { data: school } = useSWR("school-context", getSchoolContext);
  const time = (value: string) =>
    school
      ? new Intl.DateTimeFormat("vi-VN", {
          timeZone: school.timezone,
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(value))
      : value;
  async function submit(input: unknown) {
    setBusy(true);
    try {
      if (editing) await tripApi.update(editing.id, input);
      else await tripApi.create(input);
      await mutate();
      setOpen(false);
      toast.success("Đã lưu chuyến chuẩn bị.");
    } catch (error) {
      if (error instanceof ApiError && error.code === "TRIP_VERSION_CONFLICT") {
        setOpen(false); setEditing(undefined); setCancel(undefined);
      }
      toast.error(getErrorMessage(error));
      await mutate();
    } finally {
      setBusy(false);
    }
  }
  async function cancelTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cancel) return;
    const reason = String(
      new FormData(event.currentTarget).get("reason") ?? "",
    );
    setBusy(true);
    try {
      await tripApi.cancel(cancel.id, {
        expectedDataVersion: cancel.dataVersion,
        reason,
      });
      await mutate();
      setCancel(undefined);
      toast.success("Đã hủy chuyến.");
    } catch (error) {
      if (error instanceof ApiError && error.code === "TRIP_VERSION_CONFLICT") {
        setOpen(false); setEditing(undefined); setCancel(undefined);
      }
      toast.error(getErrorMessage(error));
      await mutate();
    } finally {
      setBusy(false);
    }
  }
  return (
    <ListPage
      title={<>Chuẩn bị chuyến</>}
      actions={
        <Button
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          Tạo chuyến
        </Button>
      }
    >
      <div className="gw-filters">
        <TemporalField
          label="Ngày phục vụ"
          type="date"
          value={date}
          onValueChange={(value) => {
            setDate(value);
            setPage(1);
          }}
        />
        <div className="grid min-w-36 gap-2">
          <label htmlFor="trip-status-filter" className="text-sm font-medium">
            Trạng thái
          </label>
          <ChoiceField
            id="trip-status-filter"
            aria-label="Lọc trạng thái chuyến"
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <Choice value="">Tất cả</Choice>
            <Choice value="PLANNED">Chuẩn bị</Choice>
            <Choice value="CANCELLED">Đã hủy</Choice>
            <Choice value="OPEN">Đang chạy (lịch sử)</Choice>
            <Choice value="COMPLETED">Hoàn tất (lịch sử)</Choice>
          </ChoiceField>
        </div>
      </div>
      <DataTable
        label="Chuyến đi"
        empty="Chưa có chuyến đi."
        rows={data?.data}
        error={error}
        refreshing={isValidating}
        retry={() => void mutate()}
        pagination={data?.metadata}
        onPage={setPage}
        pageSize={10}
        clearFilters={
          date || status
            ? () => {
                setDate("");
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
            Tạo chuyến
          </Button>
        }
        columns={[
          {
            header: "Ngày / chiều",
            cell: (row) => (
              <>
                {row.serviceDate} / {row.direction === "PICKUP" ? "Đón" : "Trả"}
              </>
            ),
          },
          {
            header: "Giờ dự kiến",
            cell: (row) => <>{time(row.plannedStartAt)}</>,
          },
          {
            header: "Nguồn lực dự kiến",
            cell: (row) => (
              <>
                {row.vehicleLabel ?? "Chưa có xe"}
                <p className="text-muted-foreground">
                  {row.driverLabel ?? "Chưa có tài xế"}
                </p>
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
              <>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailId(row.id)}
                  >
                    Chi tiết
                  </Button>
                  {row.status === "PLANNED" ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          setEditing(row);
                          setOpen(true);
                        }}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => setCancel(row)}
                      >
                        Hủy
                      </Button>
                    </>
                  ) : null}
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
        title={editing ? "Sửa chuẩn bị chuyến" : "Tạo chuyến từ lịch"}
      >
        <TripForm
          key={editing?.id ?? "new"}
          initialData={editing}
          busy={busy}
          onSubmit={submit}
          onCancel={() => setOpen(false)}
        />
      </FormDialog>
      {cancel ? (
        <FormDialog
          busy={busy}
          size="sm"
          isOpen
          onClose={() => setCancel(undefined)}
          title="Hủy chuyến"
        >
          <form onSubmit={cancelTrip} className="space-y-4">
            <p className="text-sm">
              Chưa hỗ trợ khôi phục chuyến đã hủy. Không thể tạo lại chuyến cùng
              lịch, ngày và chiều. Nếu cần đổi giờ/xe/tài xế, dùng Sửa.
            </p>
            <Input
              aria-label="Lý do hủy"
              name="reason"
              placeholder="Lý do hủy"
              required
              disabled={busy}
            />
            <Button type="submit" variant="destructive" disabled={busy}>
              Xác nhận hủy
            </Button>
          </form>
        </FormDialog>
      ) : null}
      {detailId ? (
        <FormDialog
          size="lg"
          isOpen
          onClose={() => setDetailId(undefined)}
          title="Chi tiết chuyến"
        >
          <TripDetails id={detailId} />
        </FormDialog>
      ) : null}
    </ListPage>
  );
}
