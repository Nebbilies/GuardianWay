'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {Field, FieldLabel, FieldError, FieldDescription} from '@/components/ui/field'
import {Bus} from "@/types/types";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

const busSchema = z.object({
    licensePlate: z.string().min(1, "Vui lòng nhập biển số xe"),
    model: z.string().min(1, "Vui lòng nhập mẫu xe"),
    capacity: z.coerce.number<number>().min(2, "Số chỗ ngồi không hợp lệ"),
    status: z.enum(['ACTIVE', 'RETIRED', 'MAINTENANCE'], {
        error: () => ({ message: "Trạng thái không hợp lệ" })
    }),
})

export type BusFormValues = z.infer<typeof busSchema>

interface BusFormProps {
    initialData?: Partial<Bus>
    onSubmit: (data: BusFormValues & { id?: string }) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
}

export default function BusForm({
                                        initialData,
                                        onSubmit,
                                        onCancel,
                                        isLoading = false,
                                    }: BusFormProps) {

    const form = useForm<BusFormValues>({
        resolver: zodResolver(busSchema),
        defaultValues: {
            licensePlate: initialData?.licensePlate || '',
            model: initialData?.model || '',
            capacity: initialData?.capacity || 0,
            status: initialData?.status || 'ACTIVE',
        },
        mode: 'onChange',
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                licensePlate: initialData.licensePlate || '',
                model: initialData.model || '',
                capacity: initialData.capacity || 0,
                status: initialData.status || 'ACTIVE',
            })
        }
    }, [initialData, form])

    const handleSubmit = async (data: BusFormValues) => {
        if (initialData?.id) {
            await onSubmit({ ...data, id: initialData.id as string })
        } else {
            await onSubmit(data)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Controller
                name="licensePlate"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                            Biển số xe <span className={'text-destructive'}>*</span>
                        </FieldLabel>
                        <Input
                            {...field}
                            id={field.name}
                            placeholder="VD: 51A-123.45"
                            aria-invalid={fieldState.invalid}
                            disabled={isLoading}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />

            <Controller
                name="model"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                            Mẫu xe <span className={'text-destructive'}>*</span>
                        </FieldLabel>
                        <Input
                            {...field}
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            disabled={isLoading}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />

            <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                    Vị trí trên bản đồ
                </label>
                <FieldDescription>
                    Nhấp vào bản đồ để chọn vị trí của trạm dừng. Vĩ độ và kinh độ sẽ được tự động cập nhật.
                </FieldDescription>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <Controller
                        name="capacity"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name} className="text-xs text-muted-foreground mb-1">
                                    Số chỗ ngồi <span className={'text-destructive'}>*</span>
                                </FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type="number"
                                    step="any"
                                    placeholder="0"
                                    value={field.value === 0 ? '' : field.value}
                                    aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <Controller
                        name="status"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name} className="text-xs text-muted-foreground mb-1">
                                    Trạng thái <span className="text-destructive">*</span>
                                </FieldLabel>

                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger className="flex-1" aria-invalid={fieldState.invalid}>
                                        <SelectValue placeholder="Chọn trạng thái" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                                        <SelectItem value="RETIRED">Ngừng hoạt động</SelectItem>
                                        <SelectItem value="MAINTENANCE">Đang bảo trì</SelectItem>
                                    </SelectContent>
                                </Select>

                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Hủy
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? 'Đang lưu...' : initialData ? 'Cập nhật xe' : 'Thêm xe mới'}
                </Button>
            </div>
        </form>
    )
}