"use client";
import { FormLayout } from "@/components/custom/form-layout";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import type { Student } from "./contracts";
export function StudentForm({
  initialData,
  onSubmit,
  busy,
  onCancel,
}: {
  initialData?: Student;
  onSubmit: (input: unknown) => Promise<void>;
  busy: boolean;
  onCancel: () => void;
}) {
  const prefix = useId();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      studentCode: String(form.get("studentCode") ?? "").trim(),
      fullName: String(form.get("fullName") ?? "").trim(),
      classLabel: String(form.get("classLabel") ?? "").trim() || null,
      status: String(form.get("status") ?? "").trim(),
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
          <FieldLabel htmlFor={prefix + "-studentCode"}>Mã học sinh</FieldLabel>
          <Input
            placeholder="VD: HS001"
            id={prefix + "-studentCode"}
            name="studentCode"
            type="text"
            defaultValue={initialData?.studentCode ?? ""}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={prefix + "-fullName"}>Họ tên</FieldLabel>
          <Input
            placeholder="Nhập họ tên học sinh"
            id={prefix + "-fullName"}
            name="fullName"
            type="text"
            defaultValue={initialData?.fullName ?? ""}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={prefix + "-classLabel"}>Lớp</FieldLabel>
          <Input
            placeholder="VD: 6A1"
            id={prefix + "-classLabel"}
            name="classLabel"
            type="text"
            defaultValue={initialData?.classLabel ?? ""}
          />
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
      </fieldset>
    </FormLayout>
  );
}
