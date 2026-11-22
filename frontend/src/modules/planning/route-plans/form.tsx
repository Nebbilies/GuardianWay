"use client";
import { FormLayout } from "@/components/custom/form-layout";
import { callApi } from "@/lib/http/contracts";
import { TemporalField } from "@/components/custom/temporal-field";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useState, type FormEvent } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorNotice } from "@/components/error-notice";
import { PagedLookup } from "@/components/custom/paged-lookup";
import {
  vehicleApi,
  vehicleSchema,
} from "@/modules/records/vehicles/contracts";
import { stopApi } from "@/modules/planning/stops/contracts";
import { getSchoolContext } from "@/modules/system/schools/contracts";
import { policyApi } from "@/modules/system/school-policies/contracts";
import type { Plan } from "./contracts";
type DraftStop = {
  key: string;
  stopId: string;
  plannedTime: string;
  label?: string;
};
type DraftRoute = {
  key: string;
  routeCode: string;
  label: string;
  vehicleId: string;
  distanceMetres: string;
  durationSeconds: string;
  stops: DraftStop[];
};
const newStop = (): DraftStop => ({
  key: crypto.randomUUID(),
  stopId: "",
  plannedTime: "",
});
const newRoute = (): DraftRoute => ({
  key: crypto.randomUUID(),
  routeCode: "",
  label: "",
  vehicleId: "",
  distanceMetres: "",
  durationSeconds: "",
  stops: [newStop()],
});
export function PlanForm({
  initialData,
  busy,
  onSubmit,
  onCancel,
}: {
  initialData?: Plan;
  busy: boolean;
  onSubmit: (input: unknown) => Promise<void>;
  onCancel: () => void;
}) {
  const { data: school, error: schoolError, mutate: reloadSchool } = useSWR("school-context", getSchoolContext);
  const policyDate = school && new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeZone: school.timezone });
  const { data: policies, error, mutate } = useSWR("policy-versions", policyApi.list);
  const [direction, setDirection] = useState(
      initialData?.direction ?? "PICKUP",
    ),
    [policyId, setPolicyId] = useState(initialData?.policyVersionId ?? "");
  const [routes, setRoutes] = useState<DraftRoute[]>(
    () =>
      initialData?.routes.map((route) => ({
        key: route.id,
        routeCode: route.routeCode,
        label: route.label,
        vehicleId: route.vehicleId,
        distanceMetres: String(route.distanceMetres),
        durationSeconds: String(route.durationSeconds),
        stops: route.stops.map((stop) => ({
          key: stop.id,
          stopId: stop.stopId,
          plannedTime: stop.plannedTime,
          label: stop.stopSnapshot.code + " · " + stop.stopSnapshot.name,
        })),
      })) ?? [newRoute()],
  );
  function patchRoute(index: number, fields: Partial<DraftRoute>) {
    setRoutes((current) =>
      current.map((route, i) =>
        i === index ? { ...route, ...fields } : route,
      ),
    );
  }
  function patchStop(
    routeIndex: number,
    stopIndex: number,
    fields: Partial<DraftStop>,
  ) {
    setRoutes((current) =>
      current.map((route, i) =>
        i === routeIndex
          ? {
              ...route,
              stops: route.stops.map((stop, j) =>
                j === stopIndex ? { ...stop, ...fields } : stop,
              ),
            }
          : route,
      ),
    );
  }
  function moveStop(routeIndex: number, from: number, to: number) {
    const stops = [...routes[routeIndex]!.stops];
    [stops[from], stops[to]] = [stops[to]!, stops[from]!];
    patchRoute(routeIndex, { stops });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      referenceDate: String(form.get("referenceDate")),
      direction,
      policyVersionId: policyId,
      effectiveFrom: String(form.get("effectiveFrom")),
      effectiveTo: String(form.get("effectiveTo") ?? "") || null,
      routes: routes.map((route) => ({
        routeCode: route.routeCode,
        label: route.label,
        vehicleId: route.vehicleId,
        distanceMetres: Number(route.distanceMetres),
        durationSeconds: Number(route.durationSeconds),
        stops: route.stops.map((stop) => ({
          stopId: stop.stopId,
          plannedTime: stop.plannedTime,
        })),
      })),
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
          <Button
            type="submit"
            disabled={busy || !school || Boolean(schoolError) || Boolean(error) || !policies?.length || !policyId || routes.some((route) => route.stops.length < 2)}
          >
            Lưu bản nháp
          </Button>
        </>
      }
    >
      {schoolError && <div><ErrorNotice error={schoolError} /><Button type="button" variant="outline" onClick={() => void reloadSchool()}>Thử lại</Button></div>}
      {error && <div><ErrorNotice error={error} /><Button type="button" variant="outline" onClick={() => void mutate()}>Thử lại</Button></div>}
      <fieldset disabled={busy} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <TemporalField
            label="Ngày tham chiếu"
            name="referenceDate"
            type="date"
            defaultValue={initialData?.referenceDate}
            required
          />
          <label className="space-y-2 text-sm">
            Hướng đi
            <ChoiceField
              aria-label="Hướng đi"
              value={direction}
              onValueChange={(value) =>
                setDirection(value as "PICKUP" | "DROPOFF")
              }
              disabled={Boolean(initialData)}
            >
              <Choice value="PICKUP">Đón đến trường</Choice>
              <Choice value="DROPOFF">Trả về</Choice>
            </ChoiceField>
          </label>
          <TemporalField
            label="Hiệu lực từ"
            name="effectiveFrom"
            type="date"
            defaultValue={initialData?.effectiveFrom ?? ""}
            required
          />
          <TemporalField
            label="Hiệu lực đến (tùy chọn)"
            name="effectiveTo"
            type="date"
            defaultValue={initialData?.effectiveTo ?? ""}
          />
          <label className="space-y-2 text-sm sm:col-span-2">
            Cấu hình vận tải
            <ChoiceField
              aria-label="Cấu hình vận tải"
              required
              value={policyId}
              onValueChange={(value) => setPolicyId(value)}
              placeholder="Chọn cấu hình"
            >
              {policies?.map((policy) => (
                <Choice key={policy.id} value={policy.id}>
                  v{policy.versionNo} · {policyDate?.format(new Date(policy.effectiveFrom))} ·
                  Đến {policy.pickupArrivalTime ?? "chưa đặt"} / Rời{" "}
                  {policy.dropoffDepartureTime ?? "chưa đặt"}
                </Choice>
              ))}
            </ChoiceField>
          </label>
        </div>
        {routes.map((route, index) => (
          <section
            key={route.key}
            aria-label={`Tuyến ${index + 1}`}
            className="space-y-4 rounded-lg border p-4"
          >
            <div className="flex justify-between">
              <h3 className="font-semibold">Tuyến {index + 1}</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={routes.length <= 1}
                onClick={() => setRoutes(routes.filter((_, i) => i !== index))}
              >
                Bỏ tuyến
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                Mã tuyến
                <Input
                  placeholder="VD: T01"
                  value={route.routeCode}
                  onChange={(event) =>
                    patchRoute(index, { routeCode: event.target.value })
                  }
                  required
                />
              </label>
              <label className="space-y-2 text-sm">
                Tên tuyến
                <Input
                  placeholder="VD: Tuyến Bình Thạnh"
                  value={route.label}
                  onChange={(event) =>
                    patchRoute(index, { label: event.target.value })
                  }
                  required
                />
              </label>
              <label className="space-y-2 text-sm">
                Quãng đường ước tính (mét)
                <Input
                  placeholder="VD: 12000"
                  type="number"
                  min="0.01"
                  step="any"
                  value={route.distanceMetres}
                  onChange={(event) =>
                    patchRoute(index, { distanceMetres: event.target.value })
                  }
                  required
                />
              </label>
              <label className="space-y-2 text-sm">
                Thời lượng ước tính (giây)
                <Input
                  placeholder="VD: 1800"
                  type="number"
                  min={1}
                  step={1}
                  value={route.durationSeconds}
                  onChange={(event) =>
                    patchRoute(index, { durationSeconds: event.target.value })
                  }
                  required
                />
              </label>
            </div>
            <PagedLookup
              cacheKey="plan-vehicles"
              resolveLabel={async (id) => {
                const v = await callApi(
                  { method: "GET", path: "/buses/" + id },
                  vehicleSchema,
                );
                return v.code + " / " + v.plateNumber;
              }}
              label="Xe"
              required
              value={route.vehicleId}
              onChange={(vehicleId) => patchRoute(index, { vehicleId })}
              load={(query) =>
                vehicleApi.list({ ...query, status: "AVAILABLE" })
              }
              describe={(vehicle) =>
                vehicle.code +
                " · " +
                vehicle.plateNumber +
                " · " +
                vehicle.studentCapacity +
                " học sinh"
              }
            />
            <p className="text-xs text-muted-foreground">
              Mỗi tuyến cần ít nhất 2 điểm. Tuyến đón kết thúc tại trường, tuyến
              trả bắt đầu tại trường.
            </p>
            {route.stops.map((stop, stopIndex) => (
              <div
                key={stop.key}
                className="grid gap-3 rounded-md bg-muted/30 p-3 md:grid-cols-[minmax(0,1fr)_14rem_auto]"
              >
                <PagedLookup
                  cacheKey="plan-stops"
                  label={"Điểm " + (stopIndex + 1)}
                  required
                  value={stop.stopId}
                  selectedLabel={stop.label}
                  onChange={(stopId) =>
                    patchStop(index, stopIndex, { stopId, label: undefined })
                  }
                  load={(query) => stopApi.list({ ...query, status: "ACTIVE" })}
                  describe={(point) =>
                    point.code +
                    " · " +
                    point.name +
                    (point.kind === "SCHOOL" ? " (Trường)" : "")
                  }
                />
                <TemporalField
                  label="Giờ ghé"
                  type="time"
                  required
                  value={stop.plannedTime}
                  onValueChange={(value) =>
                    patchStop(index, stopIndex, { plannedTime: value })
                  }
                />
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Đưa điểm lên"
                    disabled={stopIndex === 0}
                    onClick={() => moveStop(index, stopIndex, stopIndex - 1)}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-label="Đưa điểm xuống"
                    disabled={stopIndex === route.stops.length - 1}
                    onClick={() => moveStop(index, stopIndex, stopIndex + 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={route.stops.length <= 1}
                    onClick={() =>
                      patchRoute(index, {
                        stops: route.stops.filter((_, i) => i !== stopIndex),
                      })
                    }
                  >
                    Bỏ
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                patchRoute(index, { stops: [...route.stops, newStop()] })
              }
            >
              Thêm lượt ghé điểm
            </Button>
          </section>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setRoutes([...routes, newRoute()])}
        >
          Thêm tuyến
        </Button>
      </fieldset>
    </FormLayout>
  );
}
