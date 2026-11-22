"use client";
import { FormLayout } from "@/components/custom/form-layout";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useId, type FormEvent } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { School } from "./contracts";
export function SchoolForm({
  initialData,
  busy,
  onSubmit,
  onCancel,
}: {
  initialData?: School;
  busy: boolean;
  onSubmit: (input: unknown) => Promise<void>;
  onCancel: () => void;
}) {
  const prefix = useId();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      code: String(form.get("code") ?? ""),
      name: String(form.get("name") ?? ""),
      address: String(form.get("address") ?? ""),
      timezone: String(form.get("timezone") ?? ""),
      contactPhone: String(form.get("contactPhone") ?? "").trim() || null,
      contactEmail: String(form.get("contactEmail") ?? "").trim() || null,
      status: String(form.get("status")),
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
            Lưu
          </Button>
        </>
      }
    >
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={prefix + "code"}>Mã trường</FieldLabel>
          <Input
            placeholder="VD: TH01"
            id={prefix + "code"}
            name="code"
            defaultValue={initialData?.code}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={prefix + "name"}>Tên trường</FieldLabel>
          <Input
            placeholder="Nhập tên trường"
            id={prefix + "name"}
            name="name"
            defaultValue={initialData?.name}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={prefix + "address"}>Địa chỉ</FieldLabel>
          <Input
            placeholder="Số nhà, tên đường, phường/xã"
            id={prefix + "address"}
            name="address"
            defaultValue={initialData?.address}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={prefix + "timezone"}>Múi giờ IANA</FieldLabel>
          <Input
            placeholder="VD: Asia/Ho_Chi_Minh"
            id={prefix + "timezone"}
            name="timezone"
            defaultValue={initialData?.timezone ?? "Asia/Ho_Chi_Minh"}
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={prefix + "contactPhone"}>
            Điện thoại liên hệ
          </FieldLabel>
          <Input
            placeholder="VD: 02838221234"
            id={prefix + "contactPhone"}
            name="contactPhone"
            defaultValue={initialData?.contactPhone ?? ""}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={prefix + "contactEmail"}>
            Email liên hệ
          </FieldLabel>
          <Input
            placeholder="VD: vanphong@example.com"
            id={prefix + "contactEmail"}
            name="contactEmail"
            type="email"
            defaultValue={initialData?.contactEmail ?? ""}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={prefix + "status"}>Trạng thái</FieldLabel>
          <ChoiceField
            id={prefix + "status"}
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
