'use client'

import {useEffect} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Field, FieldError, FieldLabel} from '@/components/ui/field'
import {Bus, BusRouteWithStops, BusTripStatus, BusTripWithDetails, UserWithProfiles} from '@/types/types'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'

const busTripSchema = z.object({
    routeId: z.string().min(1, 'Vui lòng chọn tuyến đường'),
    busId: z.string().min(1, 'Vui lòng chọn xe buýt'),
    driverId: z.string().min(1, 'Vui lòng chọn tài xế'),
    date: z.string().min(1, 'Vui lòng chọn ngày chạy'),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Giờ bắt đầu không hợp lệ'),
    endTime: z.string().optional(),
    status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], {
        error: () => ({message: 'Trạng thái không hợp lệ'})
    }),
}).superRefine((data, ctx) => {
    if (!data.endTime) {
        return
    }

    const [startHour, startMinute] = data.startTime.split(':').map(Number)
    const [endHour, endMinute] = data.endTime.split(':').map(Number)
    const start = startHour * 60 + startMinute
    const end = endHour * 60 + endMinute

    if (end <= start) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Giờ kết thúc phải sau giờ bắt đầu',
            path: ['endTime'],
        })
    }
})

export type BusTripFormValues = z.infer<typeof busTripSchema>

interface BusTripFormProps {
    routes: BusRouteWithStops[]
    buses: Bus[]
    drivers: UserWithProfiles[]
    initialData?: BusTripWithDetails
    onSubmit: (data: BusTripFormValues & { id?: string }) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
}

const statusOptions: { value: BusTripStatus; label: string }[] = [
    {value: 'SCHEDULED', label: 'Đã lên lịch'},
    {value: 'IN_PROGRESS', label: 'Đang chạy'},
    {value: 'COMPLETED', label: 'Hoàn thành'},
    {value: 'CANCELLED', label: 'Đã hủy'},
]

const toDateInputValue = (value: Date | string) => {
    const date = new Date(value)
    return date.toISOString().split('T')[0]
}

const toTimeInputValue = (value: Date | string | null | undefined) => {
    if (!value) return ''
    return new Date(value).toISOString().substring(11, 16)
}

const toDriverLabel = (driver: UserWithProfiles) => {
    const license = driver.driverProfile?.licenseNumber
    if (license) {
        return `${driver.name} (${license})`
    }
    return driver.name
}

const toDriverOptions = (drivers: UserWithProfiles[]) => {
    return drivers.flatMap((driver) => {
        if (!driver.driverProfile) {
            return []
        }

        return [{
            id: driver.driverProfile.id,
            label: toDriverLabel(driver),
        }]
    })
}

export default function BusTripForm({
                                        routes,
                                        buses,
                                        drivers,
                                        initialData,
                                        onSubmit,
                                        onCancel,
                                        isLoading = false,
                                    }: BusTripFormProps) {
    const form = useForm<BusTripFormValues>({
        resolver: zodResolver(busTripSchema),
        defaultValues: {
            routeId: initialData?.routeId || '',
            busId: initialData?.busId || '',
            driverId: initialData?.driverId || '',
            date: initialData?.date ? toDateInputValue(initialData.date) : '',
            startTime: initialData?.startTime ? toTimeInputValue(initialData.startTime) : '',
            endTime: initialData?.endTime ? toTimeInputValue(initialData.endTime) : '',
            status: initialData?.status || 'SCHEDULED',
        },
        mode: 'onChange',
    })

    useEffect(() => {
        if (!initialData) {
            form.reset({
                routeId: '',
                busId: '',
                driverId: '',
                date: '',
                startTime: '',
                endTime: '',
                status: 'SCHEDULED',
            })
            return
        }

        form.reset({
            routeId: initialData.routeId,
            busId: initialData.busId,
            driverId: initialData.driverId,
            date: toDateInputValue(initialData.date),
            startTime: toTimeInputValue(initialData.startTime),
            endTime: toTimeInputValue(initialData.endTime),
            status: initialData.status,
        })
    }, [initialData, form])

    const handleSubmit = async (data: BusTripFormValues) => {
        const payload = {
            ...data,
            endTime: data.endTime?.trim() ? data.endTime : undefined,
        }

        if (initialData?.id) {
            await onSubmit({...payload, id: initialData.id})
        } else {
            await onSubmit(payload)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className={'space-y-6'}>
            <div className={'space-y-4'}>
                <h3 className={'text-base font-semibold'}>Thông tin chuyến đi</h3>
                <div className={'grid grid-cols-1 gap-4 md:grid-cols-2'}>
                    <Controller
                        name="routeId"
                        control={form.control}
                        render={({field, fieldState}) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Tuyến đường <span className={'text-destructive'}>*</span></FieldLabel>
                                <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                                    <SelectTrigger aria-invalid={fieldState.invalid}>
                                        <SelectValue placeholder={'Chọn tuyến đường'}/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {routes.map((route) => (
                                            <SelectItem key={route.id} value={route.id}>{route.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                            </Field>
                        )}
                    />

                    <Controller
                        name="date"
                        control={form.control}
                        render={({field, fieldState}) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Ngày chạy <span className={'text-destructive'}>*</span></FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type={'date'}
                                    aria-invalid={fieldState.invalid}
                                    disabled={isLoading}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                            </Field>
                        )}
                    />

                    <Controller
                        name="status"
                        control={form.control}
                        render={({field, fieldState}) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Trạng thái <span className={'text-destructive'}>*</span></FieldLabel>
                                <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                                    <SelectTrigger aria-invalid={fieldState.invalid}>
                                        <SelectValue placeholder={'Chọn trạng thái'}/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((option) => (
                                            <SelectItem key={option.value}
                                                        value={option.value}>{option.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                            </Field>
                        )}
                    />
                </div>
            </div>

            <div className={'space-y-4'}>
                <h3 className={'text-base font-semibold'}>Phân công</h3>
                <div className={'grid grid-cols-1 gap-4 md:grid-cols-2'}>
                    <Controller
                        name="busId"
                        control={form.control}
                        render={({field, fieldState}) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Xe buýt <span className={'text-destructive'}>*</span></FieldLabel>
                                <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                                    <SelectTrigger aria-invalid={fieldState.invalid}>
                                        <SelectValue placeholder={'Chọn xe buýt'}/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {buses.map((bus) => (
                                            <SelectItem key={bus.id}
                                                        value={bus.id}>{bus.licensePlate} - {bus.model}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                            </Field>
                        )}
                    />

                    <Controller
                        name="driverId"
                        control={form.control}
                        render={({field, fieldState}) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Tài xế <span className={'text-destructive'}>*</span></FieldLabel>
                                <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                                    <SelectTrigger aria-invalid={fieldState.invalid}>
                                        <SelectValue placeholder={'Chọn tài xế'}/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {toDriverOptions(drivers).map((driver) => (
                                            <SelectItem key={driver.id} value={driver.id}>
                                                {driver.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                            </Field>
                        )}
                    />
                </div>
            </div>

            <div className={'space-y-4'}>
                <h3 className={'text-base font-semibold'}>Thời gian</h3>
                <div className={'grid grid-cols-1 gap-4 md:grid-cols-2'}>
                    <Controller
                        name="startTime"
                        control={form.control}
                        render={({field, fieldState}) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Giờ bắt đầu <span
                                    className={'text-destructive'}>*</span></FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type={'time'}
                                    aria-invalid={fieldState.invalid}
                                    disabled={isLoading}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                            </Field>
                        )}
                    />

                    <Controller
                        name="endTime"
                        control={form.control}
                        render={({field, fieldState}) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Giờ kết thúc</FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type={'time'}
                                    aria-invalid={fieldState.invalid}
                                    disabled={isLoading}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
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
                    {isLoading ? 'Đang lưu...' : initialData ? 'Cập nhật chuyến đi' : 'Tạo chuyến đi'}
                </Button>
            </div>
        </form>
    )
}
