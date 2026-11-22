"use client";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useId } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Driver } from "./contracts";
export function DriverProfileFields({
  initialData,
  namePrefix = "",
}: {
  initialData?: Partial<Driver>;
  namePrefix?: string;
}) {
  const prefix = useId();
  return (
    <div className="col-span-full grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor={prefix + "-code"}>Mã tài xế</FieldLabel>
        <Input
          placeholder="VD: TX001"
          id={prefix + "-code"}
          name={namePrefix + "code"}
          type="text"
          defaultValue={initialData?.code ?? ""}
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={prefix + "-fullName"}>Họ tên</FieldLabel>
        <Input
          placeholder="Nhập họ tên tài xế"
          id={prefix + "-fullName"}
          name={namePrefix + "fullName"}
          type="text"
          defaultValue={initialData?.fullName ?? ""}
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={prefix + "-phone"}>Điện thoại</FieldLabel>
        <Input
          placeholder="VD: 0901234567"
          id={prefix + "-phone"}
          name={namePrefix + "phone"}
          type="text"
          defaultValue={initialData?.phone ?? ""}
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={prefix + "-status"}>Trạng thái</FieldLabel>
        <ChoiceField
          id={prefix + "-status"}
          name={namePrefix + "status"}
          defaultValue={initialData?.status ?? "AVAILABLE"}
        >
          <Choice value="AVAILABLE">Sẵn sàng</Choice>
          <Choice value="UNAVAILABLE">Không sẵn sàng</Choice>
        </ChoiceField>
      </Field>
      <Field>
        <FieldLabel htmlFor={prefix + "-notes"}>Ghi chú</FieldLabel>
        <Input
          placeholder="Nhập ghi chú về tài xế"
          id={prefix + "-notes"}
          name={namePrefix + "notes"}
          type="text"
          defaultValue={initialData?.notes ?? ""}
        />
      </Field>
    </div>
  );
}
