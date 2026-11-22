"use client";
import { FormLayout } from "@/components/custom/form-layout";
import { CheckField } from "@/components/custom/check-field";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import type { Stop } from "./contracts";
import dynamic from "next/dynamic";
const MapComponent = dynamic(() => import("@/app/(landing)/map/MapComponent"), {
  ssr: false,
});
export function StopForm({
  initialData,
  onSubmit,
  busy,
  onCancel,
}: {
  initialData?: Stop;
  onSubmit: (input: unknown) => Promise<void>;
  busy: boolean;
  onCancel: () => void;
}) {
  const prefix = useId();
  const [latitude, setLatitude] = useState<string | number>(
    initialData?.latitude ?? "",
  );
  const [longitude, setLongitude] = useState<string | number>(
    initialData?.longitude ?? "",
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      code: String(form.get("code") ?? "").trim(),
      name: String(form.get("name") ?? "").trim(),
      address: String(form.get("address") ?? "").trim(),
      latitude: Number(form.get("latitude")),
      longitude: Number(form.get("longitude")),
      kind: String(form.get("kind") ?? "").trim(),
      allowsPickup: form.get("allowsPickup") === "on",
      allowsDropoff: form.get("allowsDropoff") === "on",
      status: String(form.get("status") ?? "").trim(),
      accessNote: String(form.get("accessNote") ?? "").trim() || null,
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
            onClick={onCancel}
            disabled={busy}
          >
            Đóng
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Đang lưu..." : "Lưu"}
          </Button>
        </>
      }
    >
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={prefix + "-code"}>Mã điểm</FieldLabel>
          <Input
            placeholder="VD: DD01"
            id={prefix + "-code"}
            name="code"
            type="text"
            defaultValue={initialData?.code ?? ""}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={prefix + "-name"}>Tên điểm</FieldLabel>
          <Input
            placeholder="VD: Cổng công viên"
            id={prefix + "-name"}
            name="name"
            type="text"
            defaultValue={initialData?.name ?? ""}
            required
          />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor={prefix + "-address"}>Địa chỉ</FieldLabel>
          <Input
            placeholder="Số nhà, tên đường, phường/xã"
            id={prefix + "-address"}
            name="address"
            type="text"
            defaultValue={initialData?.address ?? ""}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={prefix + "-latitude"}>Vĩ độ</FieldLabel>
          <Input
            placeholder="VD: 10.7769"
            id={prefix + "-latitude"}
            name="latitude"
            type="number"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            min={-90}
            max={90}
            step="any"
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={prefix + "-longitude"}>Kinh độ</FieldLabel>
          <Input
            placeholder="VD: 106.7009"
            id={prefix + "-longitude"}
            name="longitude"
            type="number"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            min={-180}
            max={180}
            step="any"
            required
          />
        </Field>
        <div className="col-span-full overflow-hidden rounded-lg border">
          <MapComponent
            mapHeight={260}
            latLng={
              latitude !== "" && longitude !== ""
                ? { lat: Number(latitude), lng: Number(longitude) }
                : null
            }
            setLatLng={(point) => {
              setLatitude(point.lat);
              setLongitude(point.lng);
            }}
          />
        </div>
        <Field>
          <FieldLabel htmlFor={prefix + "-kind"}>Loại điểm</FieldLabel>
          <ChoiceField
            id={prefix + "-kind"}
            name="kind"
            defaultValue={initialData?.kind ?? "SERVICE_POINT"}
          >
            <Choice value="SERVICE_POINT">Điểm phục vụ</Choice>
            <Choice value="SCHOOL">Trường học</Choice>
          </ChoiceField>
        </Field>
        <Field>
          <FieldLabel htmlFor={prefix + "-status"}>Trạng thái</FieldLabel>
          <ChoiceField
            id={prefix + "-status"}
            name="status"
            defaultValue={initialData?.status ?? "ACTIVE"}
          >
            <Choice value="ACTIVE">Hoạt động</Choice>
            <Choice value="INACTIVE">Ngừng hoạt động</Choice>
          </ChoiceField>
        </Field>
        <Field orientation="horizontal">
          <CheckField
            id={prefix + "-allowsPickup"}
            name="allowsPickup"
            defaultChecked={initialData?.allowsPickup ?? true}
          />
          <FieldLabel htmlFor={prefix + "-allowsPickup"}>
            Cho phép chiều đón
          </FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <CheckField
            id={prefix + "-allowsDropoff"}
            name="allowsDropoff"
            defaultChecked={initialData?.allowsDropoff ?? true}
          />
          <FieldLabel htmlFor={prefix + "-allowsDropoff"}>
            Cho phép chiều trả
          </FieldLabel>
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel htmlFor={prefix + "-accessNote"}>
            Ghi chú tiếp cận
          </FieldLabel>
          <Input
            placeholder="VD: Đón tại cổng phía đông"
            id={prefix + "-accessNote"}
            name="accessNote"
            type="text"
            defaultValue={initialData?.accessNote ?? ""}
          />
        </Field>
      </fieldset>
    </FormLayout>
  );
}
