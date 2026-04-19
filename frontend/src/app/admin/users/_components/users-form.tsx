'use client'

import {useEffect, useState} from 'react'
import {useForm, Controller} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Field, FieldLabel, FieldError} from '@/components/ui/field'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {UserWithProfiles} from '@/types/types'
import useSWR from 'swr'

const ROLE_OPTIONS = [
    {value: 'ADMIN', label: 'Quản trị viên'},
    {value: 'STAFF', label: 'Nhân viên'},
    {value: 'DRIVER', label: 'Tài xế'},
    {value: 'STUDENT', label: 'Học sinh'},
    {value: 'PARENT', label: 'Phụ huynh'},
] as const

const userSchema = z.object({
    name: z.string().min(1, "Vui lòng nhập họ tên"),
    email: z.string().min(1, "Vui lòng nhập email").email("Email không hợp lệ"),
    password: z.string().optional(),
    phoneNumber: z.string().regex(/^\d{10,11}$/, "Số điện thoại không hợp lệ").optional(),
    address: z.string().optional(),
    role: z.enum(['ADMIN', 'STAFF', 'DRIVER', 'STUDENT', 'PARENT'], {
        error: () => ({message: "Vui lòng chọn vai trò"}),
    }),
    studentId: z.string().optional(),
    studentClass: z.string().optional(),
    parentId: z.string().optional(),
    licenseNumber: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.role === 'STUDENT') {
        if (!data.studentId || data.studentId.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Vui lòng nhập mã học sinh",
                path: ['studentId'],
            })
        }
        if (!data.studentClass || data.studentClass.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Vui lòng nhập lớp",
                path: ['studentClass'],
            })
        }
    }
    if (data.role === 'DRIVER') {
        if (!data.licenseNumber || data.licenseNumber.trim() === '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Vui lòng nhập số giấy phép lái xe",
                path: ['licenseNumber'],
            })
        }
    }
})

export type UserFormValues = z.infer<typeof userSchema>

interface ParentOption {
    id: string
    name: string
    email: string
}

const parentsFetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) throw new Error('Failed to fetch parents')
    return res.json()
})

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

    // create schema with password required on create
    const schemaWithPassword = isEditing
        ? userSchema
        : userSchema.superRefine((data, ctx) => {
            if (!data.password || data.password.trim() === '') {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Vui lòng nhập mật khẩu",
                    path: ['password'],
                })
            } else if (data.password.length < 8) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Mật khẩu phải có ít nhất 8 ký tự",
                    path: ['password'],
                })
            }
        })

    const form = useForm<UserFormValues>({
        resolver: zodResolver(schemaWithPassword),
        defaultValues: {
            name: initialData?.name || '',
            email: initialData?.email || '',
            password: '',
            phoneNumber: initialData?.phoneNumber || '',
            address: initialData?.address || '',
            role: initialData?.role || 'STUDENT',
            studentId: initialData?.studentProfile?.studentId || '',
            studentClass: initialData?.studentProfile?.studentClass || '',
            parentId: initialData?.studentProfile?.parentId || '',
            licenseNumber: initialData?.driverProfile?.licenseNumber || '',
        },
        mode: 'onChange',
    })

    const watchedRole = form.watch('role')

    // Fetch parents for student role
    const {data: parents} = useSWR<ParentOption[]>(
        watchedRole === 'STUDENT' ? `${process.env.NEXT_PUBLIC_API_URL}/users/parents` : null,
        parentsFetcher
    )

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name || '',
                email: initialData.email || '',
                password: '',
                phoneNumber: initialData.phoneNumber || '',
                address: initialData.address || '',
                role: initialData.role || 'STUDENT',
                studentId: initialData.studentProfile?.studentId || '',
                studentClass: initialData.studentProfile?.studentClass || '',
                parentId: initialData.studentProfile?.parentId || '',
                licenseNumber: initialData.driverProfile?.licenseNumber || '',
            })
        }
    }, [initialData, form])

    const handleSubmit = async (data: UserFormValues) => {
        const cleanData = {...data}
        if (data.role !== 'STUDENT') {
            delete cleanData.studentId
            delete cleanData.studentClass
            delete cleanData.parentId
        }
        if (data.role !== 'DRIVER') {
            delete cleanData.licenseNumber
        }
        if (isEditing && (!cleanData.password || cleanData.password.trim() === '')) {
            delete cleanData.password
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

            <Controller
                name="password"
                control={form.control}
                render={({field, fieldState}) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                            Mật khẩu {!isEditing && <span className={'text-destructive'}>*</span>}
                        </FieldLabel>
                        <Input
                            {...field}
                            id={field.name}
                            type="password"
                            placeholder={isEditing ? "Để trống nếu không thay đổi" : "Nhập mật khẩu"}
                            aria-invalid={fieldState.invalid}
                            disabled={isLoading}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                    </Field>
                )}
            />

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

            {watchedRole === 'STUDENT' && (
                <div className="space-y-4 rounded-lg border border-border p-4">
                    <h3 className="text-sm font-semibold text-foreground">Thông tin học sinh</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Controller
                            name="studentId"
                            control={form.control}
                            render={({field, fieldState}) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Mã học sinh <span className={'text-destructive'}>*</span>
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        placeholder="VD: HS001"
                                        aria-invalid={fieldState.invalid}
                                        disabled={isLoading}
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                                </Field>
                            )}
                        />

                        <Controller
                            name="studentClass"
                            control={form.control}
                            render={({field, fieldState}) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        Lớp <span className={'text-destructive'}>*</span>
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        placeholder="VD: 10A1"
                                        aria-invalid={fieldState.invalid}
                                        disabled={isLoading}
                                    />
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                                </Field>
                            )}
                        />
                    </div>

                    <Controller
                        name="parentId"
                        control={form.control}
                        render={({field, fieldState}) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>
                                    Phụ huynh
                                </FieldLabel>
                                <Select
                                    value={field.value || ''}
                                    onValueChange={(val) => field.onChange(val === '__none__' ? '' : val)}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger aria-invalid={fieldState.invalid}>
                                        <SelectValue placeholder="Chọn phụ huynh (không bắt buộc)"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Không chọn</SelectItem>
                                        {parents?.map((parent) => (
                                            <SelectItem key={parent.id} value={parent.id}>
                                                {parent.name} ({parent.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                            </Field>
                        )}
                    />
                </div>
            )}

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
