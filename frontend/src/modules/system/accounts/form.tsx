"use client";
import { FormLayout } from "@/components/custom/form-layout";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useId, useState, type FormEvent } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PagedLookup } from "@/components/custom/paged-lookup";
import { DriverProfileFields } from "@/modules/records/drivers/profile-fields";
import { driverApi } from "@/modules/records/drivers/contracts";
import type { Account } from "./contracts";
const names: Record<string, string> = {
    ADMIN: "Quản trị trường",
    PARENT: "Phụ huynh",
    DRIVER: "Tài xế",
    ACTIVE: "Hoạt động",
    LOCKED: "Đã khóa",
    INVITED: "Đã mời",
};
export function AccountForm({
    initialData,
    platform,
    busy,
    onSubmit,
    onCancel,
}: {
    initialData?: Account;
    platform: boolean;
    busy: boolean;
    onSubmit: (input: unknown, onboarding: boolean) => Promise<void>;
    onCancel: () => void;
}) {
    const prefix = useId(),
        [role, setRole] = useState(
            initialData?.role ?? (platform ? "ADMIN" : "PARENT"),
        );
    const [mode, setMode] = useState("new"),
        [driverId, setDriverId] = useState("");
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const account = {
            displayName: String(form.get("displayName") ?? "").trim(),
            email: String(form.get("email") ?? "").trim(),
            phone: String(form.get("phone") ?? "").trim() || null,
        };
        const onboarding = !initialData && role === "DRIVER";
        if (onboarding) {
            const driver =
                mode === "new"
                    ? {
                          code: String(form.get("driver.code") ?? ""),
                          fullName: String(form.get("driver.fullName") ?? ""),
                          phone: String(form.get("driver.phone") ?? ""),
                          status: String(form.get("driver.status")),
                          notes:
                              String(form.get("driver.notes") ?? "").trim() ||
                              null,
                      }
                    : undefined;
            await onSubmit(
                { account, ...(driver ? { driver } : { driverId }) },
                true,
            );
        } else
            await onSubmit(
                {
                    ...account,
                    role,
                    ...(initialData
                        ? { status: String(form.get("status")) }
                        : {}),
                },
                false,
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
                    <Button type="submit" disabled={busy}>
                        Lưu
                    </Button>
                </>
            }
        >
            <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
                <Field>
                    <FieldLabel htmlFor={prefix + "displayName"}>
                        Tên hiển thị
                    </FieldLabel>
                    <Input
                        placeholder="Nhập tên hiển thị"
                        id={prefix + "displayName"}
                        name="displayName"
                        defaultValue={initialData?.displayName}
                        required
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={prefix + "email"}>Email</FieldLabel>
                    <Input
                        placeholder="VD: lienhe@example.com"
                        id={prefix + "email"}
                        name="email"
                        type="email"
                        defaultValue={initialData?.email}
                        required
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={prefix + "phone"}>
                        Điện thoại
                    </FieldLabel>
                    <Input
                        placeholder="VD: 0901234567"
                        id={prefix + "phone"}
                        name="phone"
                        defaultValue={initialData?.phone ?? ""}
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={prefix + "role"}>Vai trò</FieldLabel>
                    <ChoiceField
                        id={prefix + "role"}
                        value={role}
                        onValueChange={(value) =>
                            setRole(value as Account["role"])
                        }
                    >
                        {(platform
                            ? ["ADMIN"]
                            : ["ADMIN", "PARENT", "DRIVER"]
                        ).map((value) => (
                            <Choice key={value} value={value}>
                                {names[value] ?? value}
                            </Choice>
                        ))}
                    </ChoiceField>
                </Field>
                {initialData ? (
                    <Field>
                        <FieldLabel htmlFor={prefix + "status"}>
                            Trạng thái tài khoản
                        </FieldLabel>
                        <ChoiceField
                            id={prefix + "status"}
                            name="status"
                            defaultValue={initialData.status}
                        >
                            {(initialData.activatedAt
                                ? ["ACTIVE", "LOCKED"]
                                : ["INVITED", "LOCKED"]
                            ).map((value) => (
                                <Choice key={value} value={value}>
                                    {names[value] ?? value}
                                </Choice>
                            ))}
                        </ChoiceField>
                    </Field>
                ) : null}
                {!initialData && role === "DRIVER" ? (
                    <div className="col-span-full space-y-4 rounded-lg border p-4">
                        <h3 className="font-semibold">Hồ sơ tài xế</h3>
                        <ChoiceField
                            aria-label="Cách liên kết tài xế"
                            value={mode}
                            onValueChange={(value) => setMode(value)}
                        >
                            <Choice value="new">Tạo hồ sơ mới</Choice>
                            <Choice value="existing">
                                Liên kết hồ sơ chưa có tài khoản
                            </Choice>
                        </ChoiceField>
                        {mode === "new" ? (
                            <DriverProfileFields namePrefix="driver." />
                        ) : (
                            <PagedLookup
                                cacheKey="unlinked-drivers"
                                label="Hồ sơ tài xế"
                                required
                                value={driverId}
                                onChange={setDriverId}
                                load={(query) =>
                                    driverApi.list({
                                        ...query,
                                        unlinked: "true",
                                    })
                                }
                                describe={(row) =>
                                    row.code + " · " + row.fullName
                                }
                            />
                        )}
                    </div>
                ) : null}
            </fieldset>
        </FormLayout>
    );
}
