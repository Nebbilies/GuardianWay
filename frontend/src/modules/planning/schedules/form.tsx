"use client";
import { FormLayout } from "@/components/custom/form-layout";
import { callApi } from "@/lib/http/contracts";
import { TemporalField } from "@/components/custom/temporal-field";
import { CheckField } from "@/components/custom/check-field";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/error-notice";
import { PagedLookup } from "@/components/custom/paged-lookup";
import { planApi } from "@/modules/planning/route-plans/contracts";
import {
  vehicleApi,
  vehicleSchema,
} from "@/modules/records/vehicles/contracts";
import { driverApi, driverSchema } from "@/modules/records/drivers/contracts";
import type { Schedule } from "./contracts";
export function ScheduleForm({
  initialData,
  busy,
  onSubmit,
  onCancel,
}: {
  initialData?: Schedule;
  busy: boolean;
  onSubmit: (input: unknown) => Promise<void>;
  onCancel: () => void;
}) {
  const [planId, setPlanId] = useState(initialData?.planVersionId ?? ""),
    [routeId, setRouteId] = useState(initialData?.routeId ?? ""),
    [vehicleId, setVehicleId] = useState(initialData?.defaultVehicleId ?? ""),
    [driverId, setDriverId] = useState(initialData?.defaultDriverId ?? "");
  const { data: plan, error } = useSWR(
    planId ? ["schedule-plan", planId] : null,
    () => planApi.get(planId),
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      routeId,
      effectiveFrom: String(form.get("effectiveFrom")),
      effectiveTo: String(form.get("effectiveTo") ?? "") || null,
      weekdays: form.getAll("weekday").map(Number),
      plannedStartTime: String(form.get("plannedStartTime")),
      defaultVehicleId: vehicleId || null,
      defaultDriverId: driverId || null,
    });
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
          <Button type="submit" disabled={busy}>
            Lưu bản nháp
          </Button>
        </>
      }
    >
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <legend className="gw-section-title">Tuyến và phương án</legend>
        <PagedLookup
          cacheKey="approved-plan-lookup"
          label="Phương án đã duyệt"
          required
          value={planId}
          selectedLabel={
            initialData ? "Phương án của " + initialData.routeLabel : undefined
          }
          onChange={(id) => {
            setPlanId(id);
            setRouteId("");
          }}
          load={(query) => planApi.list({ ...query, status: "APPROVED" })}
          describe={(row) =>
            "v" +
            row.versionNo +
            " · " +
            row.direction +
            " · " +
            row.referenceDate
          }
        />
        {error ? <ErrorNotice error={error} /> : null}
        <label className="block space-y-2 text-sm">
          Tuyến trong phương án
          <ChoiceField
            aria-label="Tuyến trong phương án"
            value={routeId}
            required
            onValueChange={(value) => setRouteId(value)}
            placeholder="Chọn tuyến"
          >
            {plan?.routes.map((route) => (
              <Choice key={route.id} value={route.id}>
                {route.routeCode} · {route.label}
              </Choice>
            ))}
          </ChoiceField>
        </label>
        {plan ? (
          <p className="text-xs text-muted-foreground">
            Phương án hiệu lực {plan.effectiveFrom} đến{" "}
            {plan.effectiveTo ?? "Không giới hạn"}. Lịch phải nằm trong khoảng
            này.
          </p>
        ) : null}
        <h3 className="gw-section-title">Thời gian áp dụng</h3>
        <div className="col-span-full grid gap-3 sm:grid-cols-3">
          <TemporalField
            label="Hiệu lực từ"
            name="effectiveFrom"
            type="date"
            defaultValue={initialData?.effectiveFrom}
            required
          />
          <TemporalField
            label="Hiệu lực đến"
            name="effectiveTo"
            type="date"
            defaultValue={initialData?.effectiveTo ?? ""}
          />
          <TemporalField
            label="Giờ bắt đầu (múi giờ trường)"
            name="plannedStartTime"
            type="time"
            defaultValue={initialData?.plannedStartTime}
            required
          />
        </div>
        <fieldset className="col-span-full space-y-2">
          <legend className="text-sm">Ngày trong tuần</legend>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <label
                key={day}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border bg-card px-3 text-sm"
              >
                <CheckField
                  name="weekday"
                  value={String(day)}
                  defaultChecked={initialData?.weekdays.includes(day) ?? false}
                />
                {day === 7 ? "Chủ nhật" : "Thứ " + (day + 1)}
              </label>
            ))}
          </div>
        </fieldset>
        <h3 className="gw-section-title">Phân công mặc định</h3>
        <PagedLookup
          cacheKey="schedule-vehicles"
          resolveLabel={async (id) => {
            const v = await callApi(
              { method: "GET", path: "/buses/" + id },
              vehicleSchema,
            );
            return v.code + " / " + v.plateNumber;
          }}
          label="Xe mặc định (tùy chọn)"
          value={vehicleId}
          onChange={setVehicleId}
          load={(query) => vehicleApi.list({ ...query, status: "AVAILABLE" })}
          describe={(row) => row.code + " · " + row.plateNumber}
        />
        <PagedLookup
          cacheKey="schedule-drivers"
          resolveLabel={async (id) => {
            const d = await callApi(
              { method: "GET", path: "/drivers/" + id },
              driverSchema,
            );
            return d.code + " / " + d.fullName;
          }}
          label="Tài xế mặc định (tùy chọn)"
          value={driverId}
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
