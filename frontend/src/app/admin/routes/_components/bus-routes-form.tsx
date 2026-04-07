'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {Field, FieldLabel, FieldError} from '@/components/ui/field'
import {BusRoute} from "@/types/types";
import {Textarea} from "@/components/ui/textarea";

const busRouteSchema = z.object({
    name: z.string().min(1, "Vui lòng nhập tên tuyến đường"),
    description: z.string().max(500, "Mô tả không được vượt quá 500 ký tự").optional(),
})

export type BusRouteFormValues = z.infer<typeof busRouteSchema>

interface BusRouteFormProps {
    initialData?: Partial<BusRoute>
    onSubmit: (data: BusRouteFormValues & { id?: string }) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
}

export default function BusRouteForm({
                                        initialData,
                                        onSubmit,
                                        onCancel,
                                        isLoading = false,
                                    }: BusRouteFormProps) {

    const form = useForm<BusRouteFormValues>({
        resolver: zodResolver(busRouteSchema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
        },
        mode: 'onChange',
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name || '',
                description: initialData.description || '',
            })
        }
    }, [initialData, form])

    const handleSubmit = async (data: BusRouteFormValues) => {
        if (initialData?.id) {
            await onSubmit({ ...data, id: initialData.id as string })
        } else {
            await onSubmit(data)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                            Tên tuyến đường
                            <span className={'text-destructive'}>*</span>
                        </FieldLabel>
                        <Input
                            {...field}
                            id={field.name}
                            placeholder="VD: Tuyến đường vành đai số 4"
                            aria-invalid={fieldState.invalid}
                            disabled={isLoading}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />

            <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>Mô tả</FieldLabel>
                        <Textarea
                            {...field}
                            id={field.name}
                            placeholder="Mô tả tuyến đường (tối đa 500 ký tự)"
                            aria-invalid={fieldState.invalid}
                            disabled={isLoading}
                            maxLength={500}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />
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