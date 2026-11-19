"use client";
import { FormLayout } from "@/components/custom/form-layout";
import { TemporalField } from "@/components/custom/temporal-field";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { PagedLookup } from "@/components/custom/paged-lookup";
import { scheduleApi } from "@/modules/planning/schedules/contracts";
import { vehicleApi } from "@/modules/records/vehicles/contracts";
import { driverApi } from "@/modules/records/drivers/contracts";
import { getSchoolContext } from "@/modules/system/schools/contracts";
import type { Trip } from "./contracts";
export function TripForm({
  initialData,
  busy,
  onSubmit,
  onCancel,
}: {
  initialData?: Trip;
  busy: boolean;
  onSubmit: (input: unknown) => Promise<void>;
  onCancel: () => void;
}) {
  const [scheduleId, setScheduleId] = useState(initialData?.scheduleId ?? ""),
    [vehicleId, setVehicleId] = useState(initialData?.initialVehicleId ?? ""),
    [driverId, setDriverId] = useState(initialData?.initialDriverId ?? "");
  const { data: school } = useSWR("school-context", getSchoolContext);
  const startTime =
    initialData && school
      ? new Intl.DateTimeFormat("en-GB", {
          timeZone: school.timezone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        }).format(new Date(initialData.plannedStartAt))
      : "";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const resources = {
      ...(vehicleId ? { vehicleId } : {}),
      ...(driverId ? { driverId } : {}),
    };
    await onSubmit(
      initialData
        ? {
            expectedDataVersion: initialData.dataVersion,
            plannedStartTime: String(form.get("plannedStartTime")),
            ...resources,
          }
        : {
            scheduleId,
            serviceDate: String(form.get("serviceDate")),
            ...resources,
          },
    );
  }
  return (
    <FormLayout
      onSubmit={submit}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onCancel}
          >
            Đóng
          </Button>
          <Button type="submit" disabled={busy || !school}>
            {initialData ? "Lưu chuẩn bị" : "Tạo chuyến"}
          </Button>
        </>
      }
    >
      <fieldset disabled={busy || !school} className="space-y-4">
        {!initialData ? (
          <>
            <PagedLookup
              cacheKey="active-schedules"
              label="Lịch áp dụng"
              required
              value={scheduleId}
              onChange={setScheduleId}
              load={(query) => scheduleApi.list({ ...query, status: "ACTIVE" })}
              describe={(row) =>
                row.routeLabel +
                " · " +
                row.direction +
                " · v" +
                row.versionNo +
                " · " +
                row.plannedStartTime
              }
            />
            <TemporalField
              label="Ngày phục vụ"
              name="serviceDate"
              type="date"
              required
            />
          </>
        ) : (
          <>
            <p className="text-sm">
              Ngày phục vụ: {initialData.serviceDate} · Phiên bản dữ liệu:{" "}
              {initialData.dataVersion}
            </p>
            <TemporalField
              label="Giờ bắt đầu dự kiến"
              key={startTime}
              name="plannedStartTime"
              type="time"
              defaultValue={startTime}
              required
            />
            <p className="text-xs text-muted-foreground">
              Đổi giờ bắt đầu dịch các giờ ghé điểm cùng khoảng thời gian, giữ
              lịch sử phiên bản và kiểm tra lại giờ đến/rời trường.
            </p>
          </>
        )}
        <PagedLookup
          cacheKey="trip-vehicles"
          label={initialData ? "Xe dự kiến" : "Ghi đè xe mặc định (tùy chọn)"}
          value={vehicleId}
          selectedLabel={initialData?.vehicleLabel ?? undefined}
          onChange={setVehicleId}
          load={(query) => vehicleApi.list({ ...query, status: "AVAILABLE" })}
          describe={(row) => row.code + " · " + row.plateNumber}
        />
        <PagedLookup
          cacheKey="trip-drivers"
          label={
            initialData ? "Tài xế dự kiến" : "Ghi đè tài xế mặc định (tùy chọn)"
          }
          value={driverId}
          selectedLabel={initialData?.driverLabel ?? undefined}
          onChange={setDriverId}
          load={(query) =>
            driverApi.list({ ...query, status: "AVAILABLE", unlinked: "false" })
          }
          describe={(row) => row.code + " · " + row.fullName}
        />
      </fieldset>
    </FormLayout>
  );
}
