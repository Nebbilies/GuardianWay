"use client";
import { ListPage } from "@/components/custom/list-page";
import { RecordStatus } from "@/components/custom/record-status";
import { DataTable } from "@/components/custom/data-table";
import { TemporalField } from "@/components/custom/temporal-field";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorNotice } from "@/components/error-notice";
import { getErrorMessage } from "@/lib/i18n";
import { schoolInstant } from "@/lib/school-time";
import { getSchoolContext } from "@/modules/system/schools/contracts";
import { policyApi } from "./contracts";
export function PoliciesPage() {
  const { data, error, isValidating, mutate } = useSWR(
      "policy-versions",
      policyApi.list,
    ),
    { data: school, error: schoolError } = useSWR(
      "school-context",
      getSchoolContext,
    );
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!school) return;
    const element = event.currentTarget,
      form = new FormData(element);
    function instant(name: string) {
      const value = String(form.get(name) ?? "");
      if (!value) return null;
      const [date, time] = value.split("T");
      return schoolInstant(date!, time!, school!.timezone).toISOString();
    }
    function time(name: string) {
      return String(form.get(name) ?? "") || null;
    }
    function number(name: string) {
      const value = String(form.get(name) ?? "").trim();
      return value ? Number(value) : null;
    }
    setBusy(true);
    try {
      await policyApi.create({
        effectiveFrom: instant("effectiveFrom"),
        effectiveTo: instant("effectiveTo"),
        pickupArrivalTime: time("pickupArrivalTime"),
        dropoffDepartureTime: time("dropoffDepartureTime"),
        rideWarningMinutes: number("rideWarningMinutes"),
        pickupWaitMinutes: number("pickupWaitMinutes"),
        gpsStaleSeconds: number("gpsStaleSeconds"),
        approvalBasis: String(form.get("approvalBasis")),
      });
      await mutate();
      element.reset();
      setRevision((n) => n + 1);
      toast.success("Đã xác nhận phiên bản cấu hình mới.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  function formatInstant(value: string) {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "medium",
      timeZone: school?.timezone ?? "UTC",
    }).format(new Date(value));
  }
  if (schoolError) return <ErrorNotice error={schoolError} />;
  return (
    <ListPage title={<>Cấu hình vận tải</>}>
      <form
        key={revision}
        onSubmit={submit}
        className="space-y-4 rounded-lg border p-5"
      >
        <fieldset
          disabled={busy || !school}
          className="grid gap-4 sm:grid-cols-2"
        >
          <TemporalField
            label="Bắt đầu hiệu lực (giờ trường)"
            name="effectiveFrom"
            type="datetime-local"
            required
          />
          <TemporalField
            label="Kết thúc hiệu lực (tùy chọn)"
            name="effectiveTo"
            type="datetime-local"
          />
          <TemporalField
            label="Giờ đến trường chiều đón"
            name="pickupArrivalTime"
            type="time"
          />
          <TemporalField
            label="Giờ rời trường chiều trả"
            name="dropoffDepartureTime"
            type="time"
          />
          <label className="space-y-2 text-sm">
            Ngưỡng cảnh báo ngồi xe (phút)
            <Input
              placeholder="VD: 45"
              name="rideWarningMinutes"
              type="number"
              min="0.01"
              step="any"
            />
          </label>
          <label className="space-y-2 text-sm">
            Thời gian chờ tại điểm (phút)
            <Input
              placeholder="VD: 3"
              name="pickupWaitMinutes"
              type="number"
              min={0}
              step="any"
            />
          </label>
          <label className="space-y-2 text-sm">
            Ngưỡng vị trí cũ (giây)
            <Input
              placeholder="VD: 60"
              name="gpsStaleSeconds"
              type="number"
              min={1}
              step={1}
            />
          </label>
          <label className="space-y-2 text-sm sm:col-span-2">
            Căn cứ xác nhận
            <Input
              name="approvalBasis"
              placeholder="Căn cứ / ghi chú của nhà trường"
              required
            />
          </label>
        </fieldset>
        <Button type="submit" disabled={busy || !school}>
          Xác nhận phiên bản cấu hình
        </Button>
      </form>
      <DataTable
        label="Phiên bản cấu hình"
        empty="Chưa có phiên bản cấu hình."
        rows={data}
        error={error}
        refreshing={isValidating}
        retry={() => void mutate()}
        columns={[
          { header: "Phiên bản", cell: (row) => row.versionNo },
          {
            header: "Trạng thái",
            cell: (row) => <RecordStatus value={row.status} />,
          },
          {
            header: "Hiệu lực",
            cell: (row) => (
              <>
                {formatInstant(row.effectiveFrom)}
                <small>
                  {row.effectiveTo
                    ? formatInstant(row.effectiveTo)
                    : "Không giới hạn"}
                </small>
              </>
            ),
          },
          { header: "Giờ đến", cell: (row) => row.pickupArrivalTime ?? "—" },
          { header: "Giờ rời", cell: (row) => row.dropoffDepartureTime ?? "—" },
          { header: "Căn cứ", cell: (row) => row.approvalBasis },
        ]}
      />
    </ListPage>
  );
}
