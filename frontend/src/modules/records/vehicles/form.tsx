"use client";
import { FormLayout } from "@/components/custom/form-layout";
import { ChoiceField, Choice } from "@/components/custom/choice-field";
import { useId, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import type { Vehicle } from "./contracts";
export function VehicleForm({
    initialData,
    onSubmit,
    busy,
    onCancel,
}: {
    initialData?: Vehicle;
    onSubmit: (input: unknown) => Promise<void>;
    busy: boolean;
    onCancel: () => void;
}) {
    const prefix = useId();
    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        await onSubmit({
            code: String(form.get("code") ?? "").trim(),
            plateNumber: String(form.get("plateNumber") ?? "").trim(),
            studentCapacity: Number(form.get("studentCapacity")),
            status: String(form.get("status") ?? "").trim(),
            description: String(form.get("description") ?? "").trim() || null,
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
                    <FieldLabel htmlFor={prefix + "-code"}>Mã xe</FieldLabel>
                    <Input
                        placeholder="VD: XE01"
                        id={prefix + "-code"}
                        name="code"
                        type="text"
                        defaultValue={initialData?.code ?? ""}
                        required
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={prefix + "-plateNumber"}>
                        Biển số
                    </FieldLabel>
                    <Input
                        placeholder="VD: 51B-123.45"
                        id={prefix + "-plateNumber"}
                        name="plateNumber"
                        type="text"
                        defaultValue={initialData?.plateNumber ?? ""}
                        required
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={prefix + "-studentCapacity"}>
                        Sức chứa học sinh
                    </FieldLabel>
                    <Input
                        placeholder="VD: 28"
                        id={prefix + "-studentCapacity"}
                        name="studentCapacity"
                        type="number"
                        defaultValue={initialData?.studentCapacity ?? ""}
                        min={1}
                        max={200}
                        step={1}
                        required
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor={prefix + "-status"}>
                        Trạng thái
                    </FieldLabel>
                    <ChoiceField
                        id={prefix + "-status"}
                        name="status"
                        defaultValue={initialData?.status ?? "AVAILABLE"}
                    >
                        <Choice value="AVAILABLE">Sẵn sàng</Choice>
                        <Choice value="UNAVAILABLE">Không sẵn sàng</Choice>
                    </ChoiceField>
                </Field>
                <Field>
                    <FieldLabel htmlFor={prefix + "-description"}>
                        Mô tả
                    </FieldLabel>
                    <Input
                        placeholder="VD: Xe 29 chỗ, màu trắng"
                        id={prefix + "-description"}
                        name="description"
                        type="text"
                        defaultValue={initialData?.description ?? ""}
                    />
                </Field>
            </fieldset>
        </FormLayout>
    );
}
