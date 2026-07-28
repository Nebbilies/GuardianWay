'use client'

import {useEffect} from 'react'
import {useForm, Controller} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Field, FieldLabel, FieldError} from '@/components/ui/field'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {UserWithProfiles} from '@/types/types'

// SUPER_ADMIN is intentionally absent — it is a null-school system account created
// only through the (deferred) super-admin console, never from a school's admin portal.
const ROLE_OPTIONS = [
    {value: 'ADMIN', label: 'Quản trị viên'},
    {value: 'DRIVER', label: 'Tài xế'},
    {value: 'PARENT', label: 'Phụ huynh'},
] as const

const userSchema = z.object({
    name: z.string().min(1, "Vui lòng nhập họ tên"),
    email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
    phoneNumber: z.string().regex(/^\d{10,11}$/, "Số điện thoại không hợp lệ").optional().or(z.literal('')),
    address: z.string().optional(),
    role: z.enum(['ADMIN', 'DRIVER', 'PARENT'], {
        error: () => ({message: "Vui lòng chọn vai trò"}),
    }),
    licenseNumber: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.role === 'DRIVER' && !data.licenseNumber?.trim()) {
        ctx.addIssue({
            code: 'custom',
            message: "Vui lòng nhập số giấy phép lái xe",
            path: ['licenseNumber'],
        })
    }
})

export type UserFormValues = z.infer<typeof userSchema>

interface UserFormProps {
    initialData?: UserWithProfiles
    onSubmit: (data: UserFormValues & { id?: string }) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
}

export default function UserForm({
                                     initialData,
                                     onSubmit,
                                     onCancel,
                                     isLoading = false,
                                 }: UserFormProps) {
    const isEditing = !!initialData?.id

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: initialData?.name || '',
            email: initialData?.email || '',
            phoneNumber: initialData?.phoneNumber || '',
            address: initialData?.address || '',
            role: initialData?.role === 'SUPER_ADMIN' ? 'ADMIN' : (initialData?.role || 'PARENT'),
            licenseNumber: initialData?.driverProfile?.licenseNumber || '',
        },
        mode: 'onChange',
    })

    const watchedRole = form.watch('role')

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name || '',
                email: initialData.email || '',
                phoneNumber: initialData.phoneNumber || '',
                address: initialData.address || '',
                role: initialData.role === 'SUPER_ADMIN' ? 'ADMIN' : (initialData.role || 'PARENT'),
                licenseNumber: initialData.driverProfile?.licenseNumber || '',
            })
        }
    }, [initialData, form])

    const handleSubmit = async (data: UserFormValues) => {
        const cleanData: UserFormValues = {
            name: data.name,
            email: data.email,
            role: data.role,
            phoneNumber: data.phoneNumber || undefined,
            address: data.address || undefined,
            ...(data.role === 'DRIVER' ? {licenseNumber: data.licenseNumber} : {}),
        }
        if (initialData?.id) {
            await onSubmit({...cleanData, id: initialData.id})
        } else {
            await onSubmit(cleanData)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Controller
                name="name"
                control={form.control}
                render={({field, fieldState}) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                            Họ tên <span className={'text-destructive'}>*</span>
                        </FieldLabel>
                        <Input
                            {...field}
                            id={field.name}
                            placeholder="VD: Nguyễn Văn A"
                            aria-invalid={fieldState.invalid}
                            disabled={isLoading}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                    </Field>
                )}
            />

            <Controller
                name="email"
                control={form.control}
                render={({field, fieldState}) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                            Email <span className={'text-destructive'}>*</span>
                        </FieldLabel>
                        <Input
                            {...field}
                            id={field.name}
                            type="email"
                            placeholder="VD: user@example.com"
                            aria-invalid={fieldState.invalid}
                            disabled={isLoading}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                    </Field>
                )}
            />

            {!isEditing && (
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    Người dùng mới sẽ nhận liên kết mời để thiết lập mật khẩu.
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <Controller
                    name="phoneNumber"
                    control={form.control}
                    render={({field, fieldState}) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>
                                Số điện thoại
                            </FieldLabel>
                            <Input
                                {...field}
                                id={field.name}
                                placeholder="VD: 0901234567"
                                aria-invalid={fieldState.invalid}
                                disabled={isLoading}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                        </Field>
                    )}
                />

                <Controller
                    name="address"
                    control={form.control}
                    render={({field, fieldState}) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={field.name}>
                                Địa chỉ
                            </FieldLabel>
                            <Input
                                {...field}
                                id={field.name}
                                placeholder="VD: 123 Đường ABC, Quận 1"
                                aria-invalid={fieldState.invalid}
                                disabled={isLoading}
                            />
                            {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                        </Field>
                    )}
                />
            </div>

            <Controller
                name="role"
                control={form.control}
                render={({field, fieldState}) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                            Vai trò <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isLoading}
                        >
                            <SelectTrigger aria-invalid={fieldState.invalid}>
                                <SelectValue placeholder="Chọn vai trò"/>
                            </SelectTrigger>
                            <SelectContent>
                                {ROLE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                    </Field>
                )}
            />

            {watchedRole === 'DRIVER' && (
                <div className="space-y-4 rounded-lg border border-border p-4">
                    <h3 className="text-sm font-semibold text-foreground">Thông tin tài xế</h3>
                    <Controller
                        name="licenseNumber"
                        control={form.control}
                        render={({field, fieldState}) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>
                                    Số giấy phép lái xe <span className={'text-destructive'}>*</span>
                                </FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    placeholder=""
                                    aria-invalid={fieldState.invalid}
                                    disabled={isLoading}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                            </Field>
                        )}
                    />
                </div>
            )}

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
                    {isLoading ? 'Đang lưu...' : isEditing ? 'Cập nhật người dùng' : 'Thêm người dùng mới'}
                </Button>
            </div>
        </form>
    )
}
