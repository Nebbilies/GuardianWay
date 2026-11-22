"use client";
import { FormLayout } from "@/components/custom/form-layout";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { DriverProfileFields } from "./profile-fields";
import { Field, FieldLabel } from "@/components/ui/field";
import type { Driver } from "./contracts";
import { PagedLookup } from "@/components/custom/paged-lookup";
import { accountApi } from "@/modules/system/accounts/contracts";
export function DriverForm({
  initialData,
  onSubmit,
  busy,
  onCancel,
}: {
  initialData?: Driver;
  onSubmit: (input: unknown) => Promise<void>;
  busy: boolean;
  onCancel: () => void;
}) {
  const prefix = useId();
  const [accountId, setAccountId] = useState(initialData?.accountId ?? "");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      code: String(form.get("code") ?? "").trim(),
      fullName: String(form.get("fullName") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      status: String(form.get("status") ?? "").trim(),
      notes: String(form.get("notes") ?? "").trim() || null,
      ...(!initialData || accountId !== (initialData.accountId ?? "") ? { accountId: accountId || null } : {}),
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
        <DriverProfileFields initialData={initialData} />
        <Field>
          <FieldLabel htmlFor={prefix + "-accountId"}>
            Tài khoản tài xế
          </FieldLabel>
          <PagedLookup
            cacheKey="driver-accounts"
            label="Tài khoản tài xế"
            value={accountId}
            onChange={setAccountId}
            load={(query) => accountApi.list({ ...query, role: "DRIVER" })}
            describe={(row) => row.displayName + " · " + row.email}
          />
        </Field>
      </fieldset>
    </FormLayout>
  );
}
