'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {BusStop} from "@/types/types";

const busStopSchema = z.object({
    name: z.string().min(1, "Vui lòng nhập tên trạm dừng"),
    address: z.string().min(1, "Vui lòng nhập địa chỉ"),
    latitude: z.coerce.number<number>().min(-90, "Vĩ độ không hợp lệ").max(90, "Vĩ độ không hợp lệ"),
    longitude: z.coerce.number<number>().min(-180, "Kinh độ không hợp lệ").max(180, "Kinh độ không hợp lệ"),
})

export type BusStopFormValues = z.infer<typeof busStopSchema>

interface BusStopFormProps {
    initialData?: Partial<BusStop>
    onSubmit: (data: BusStopFormValues) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
}

export default function BusStopForm({
                                initialData,
                                onSubmit,
                                onCancel,
                                isLoading = false,
                            }: BusStopFormProps) {

    const form = useForm<BusStopFormValues>({
        resolver: zodResolver(busStopSchema),
        defaultValues: {
            name: initialData?.name || '',
            address: initialData?.address || '',
            latitude: initialData?.latitude || 0,
            longitude: initialData?.longitude || 0,
        },
        mode: 'onChange',
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                address: initialData.address,
                latitude: initialData.latitude,
                longitude: initialData.longitude,
            })
        }
    }, [initialData, form])

    const handleSubmit = async (data: BusStopFormValues) => {
        await onSubmit(data)
    }

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>Tên trạm dừng *</FieldLabel>
                        <Input
                            {...field}
                            id={field.name}
                            placeholder="VD: Trạm xe buýt Cổng trường"
                            aria-invalid={fieldState.invalid}
                            disabled={isLoading}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />

            <Controller
                name="address"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>Địa chỉ *</FieldLabel>
                        <Input
                            {...field}
                            id={field.name}
                            placeholder="VD: 123 Đường Điện Biên Phủ, Quận Bình Thạnh"
                            aria-invalid={fieldState.invalid}
                            disabled={isLoading}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />

            <div className="space-y-4">
                <label className="block text-sm font-medium text-foreground">
                    Vị trí trên bản đồ
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <Controller
                        name="latitude"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name} className="text-xs text-muted-foreground mb-1">
                                    Vĩ độ (Latitude)
                                </FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type="number"
                                    step="any"
                                    placeholder="Lat"
                                    value={field.value === 0 ? '' : field.value}
                                    aria-invalid={fieldState.invalid}
                                    disabled={isLoading}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />

                    <Controller
                        name="longitude"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name} className="text-xs text-muted-foreground mb-1">
                                    Kinh độ (Longitude)
                                </FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type="number"
                                    step="any"
                                    placeholder="Long"
                                    value={field.value === 0 ? '' : field.value}
                                    aria-invalid={fieldState.invalid}
                                    disabled={isLoading}
                                />
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
                    {isLoading ? 'Đang lưu...' : initialData ? 'Cập nhật Trạm' : 'Tạo Trạm mới'}
                </Button>
            </div>
        </form>
    )
}