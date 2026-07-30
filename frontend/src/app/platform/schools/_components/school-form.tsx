'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { slugify } from '@gw/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { School } from '@/types/types'

const schoolSchema = z.object({
    name: z.string().min(1, 'Vui lòng nhập tên trường'),
    address: z.string().min(1, 'Vui lòng nhập địa chỉ'),
    slug: z.string().min(1, 'Slug không được để trống'),
    isActive: z.boolean(),
})

export type SchoolFormValues = z.infer<typeof schoolSchema>

interface SchoolFormProps {
    initialData?: Partial<School>
    onSubmit: (data: SchoolFormValues & { id?: string }) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
}

export default function SchoolForm({ initialData, onSubmit, onCancel, isLoading = false }: SchoolFormProps) {
    const form = useForm<SchoolFormValues>({
        resolver: zodResolver(schoolSchema),
        defaultValues: {
            name: initialData?.name || '',
            address: initialData?.address || '',
            slug: initialData?.slug || '',
            isActive: initialData?.isActive ?? true,
        },
        mode: 'onChange',
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name || '',
                address: initialData.address || '',
                slug: initialData.slug || '',
                isActive: initialData.isActive ?? true,
            })
        }
    }, [initialData, form])

    // On create, keep slug tracking the name until the user edits slug directly.
    const isEditing = Boolean(initialData?.id)

    const handleSubmit = async (data: SchoolFormValues) => {
        const payload = { ...data, slug: slugify(data.slug) }
        if (initialData?.id) await onSubmit({ ...payload, id: initialData.id as string })
        else await onSubmit(payload)
    }

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>Tên trường *</FieldLabel>
                        <Input
                            {...field}
                            id={field.name}
                            placeholder="VD: Trường Tiểu học Nguyễn Du"
                            aria-invalid={fieldState.invalid}
                            disabled={isLoading}
                            onChange={(e) => {
                                field.onChange(e)
                                if (!isEditing && !form.getFieldState('slug').isDirty) {
                                    form.setValue('slug', slugify(e.target.value), { shouldValidate: true })
                                }
                            }}
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
                        <Input {...field} id={field.name} placeholder="VD: 43 Nguyễn Du, Quận 1" aria-invalid={fieldState.invalid} disabled={isLoading} />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />

            <Controller
                name="slug"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>Slug *</FieldLabel>
                        <Input {...field} id={field.name} placeholder="truong-tieu-hoc-nguyen-du" aria-invalid={fieldState.invalid} disabled={isLoading} />
                        <FieldDescription>Định danh duy nhất của trường. Tự tạo từ tên, có thể chỉnh sửa.</FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />

            <Controller
                control={form.control}
                name="isActive"
                render={({ field, fieldState }) => (
                    <Field orientation="horizontal" data-invalid={fieldState.invalid} className="flex items-center">
                        <FieldLabel htmlFor={field.name} className="text-sm mt-2">
                            Đang hoạt động
                        </FieldLabel>
                        <Switch id={field.name} checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                    </Field>
                )}
            />

            <div className="flex justify-end gap-3 pt-6 border-t border-border">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Hủy</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Đang lưu...' : initialData?.id ? 'Cập nhật' : 'Tạo trường'}
                </Button>
            </div>
        </form>
    )
}
