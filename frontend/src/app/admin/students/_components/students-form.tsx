'use client'

import {useEffect} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Field, FieldError, FieldLabel} from '@/components/ui/field'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {StudentWithParent} from '@/types/types'

const studentSchema = z.object({
    fullName: z.string().min(1, 'Vui lòng nhập họ tên học sinh'),
    studentId: z.string().min(1, 'Vui lòng nhập mã học sinh'),
    studentClass: z.string().min(1, 'Vui lòng nhập lớp'),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Vui lòng chọn ngày sinh'),
    parentId: z.string().nullable(),
})

export type StudentFormValues = z.infer<typeof studentSchema>

// Sentinel select value for "no parent" — the field itself carries null.
const NO_PARENT = '__none__'

export interface ParentOption {
    id: string
    name: string
    email: string
}

interface StudentFormProps {
    parents: ParentOption[]
    initialData?: StudentWithParent
    onSubmit: (data: StudentFormValues & { id?: string }) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
}

const toDefaults = (initialData?: StudentWithParent): StudentFormValues => ({
    fullName: initialData?.fullName || '',
    studentId: initialData?.studentId || '',
    studentClass: initialData?.studentClass || '',
    dateOfBirth: initialData?.dateOfBirth ? initialData.dateOfBirth.slice(0, 10) : '',
    parentId: initialData?.parentId ?? null,
})

export default function StudentForm({
                                        parents,
                                        initialData,
                                        onSubmit,
                                        onCancel,
                                        isLoading = false,
                                    }: StudentFormProps) {
    const form = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: toDefaults(initialData),
        mode: 'onChange',
    })

    useEffect(() => {
        form.reset(toDefaults(initialData))
    }, [initialData, form])

    const handleSubmit = async (data: StudentFormValues) => {
        if (initialData?.id) {
            await onSubmit({...data, id: initialData.id})
        } else {
            await onSubmit(data)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Controller
                name="fullName"
                control={form.control}
                render={({field, fieldState}) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                            Họ tên học sinh <span className={'text-destructive'}>*</span>
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
                name="dateOfBirth"
                control={form.control}
                render={({field, fieldState}) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                            Ngày sinh <span className={'text-destructive'}>*</span>
                        </FieldLabel>
                        <Input
                            {...field}
                            id={field.name}
                            type="date"
                            aria-invalid={fieldState.invalid}
                            disabled={isLoading}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                    </Field>
                )}
            />

            <Controller
                name="parentId"
                control={form.control}
                render={({field, fieldState}) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>Phụ huynh</FieldLabel>
                        <Select
                            value={field.value ?? NO_PARENT}
                            onValueChange={(val) => field.onChange(val === NO_PARENT ? null : val)}
                            disabled={isLoading}
                        >
                            <SelectTrigger aria-invalid={fieldState.invalid}>
                                <SelectValue placeholder="Chọn phụ huynh (không bắt buộc)"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={NO_PARENT}>— Không có phụ huynh —</SelectItem>
                                {parents.map((parent) => (
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
                    {isLoading ? 'Đang lưu...' : initialData ? 'Cập nhật học sinh' : 'Thêm học sinh'}
                </Button>
            </div>
        </form>
    )
}
