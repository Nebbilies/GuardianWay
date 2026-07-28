'use client'

import {useEffect} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Field, FieldError, FieldLabel} from '@/components/ui/field'
import {Bus, BusRouteWithStops, BusTripStatus, BusTripWithDetails, TripType, UserWithProfiles} from '@/types/types'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {toDatetimeLocalValue, toIsoWithOffset} from '@/lib/datetime'

const busTripSchema = z.object({
    routeId: z.string().min(1, 'Vui lòng chọn tuyến đường'),
    busId: z.string().min(1, 'Vui lòng chọn xe buýt'),
    driverId: z.string().min(1, 'Vui lòng chọn tài xế'),
    tripType: z.enum(['PICKUP', 'DROPOFF'], {error: () => ({message: 'Vui lòng chọn loại chuyến'})}),
    scheduledStartTime: z.string().min(1, 'Vui lòng chọn giờ bắt đầu'),
    scheduledEndTime: z.string().min(1, 'Vui lòng chọn giờ kết thúc'),
    status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], {
        error: () => ({message: 'Trạng thái không hợp lệ'})
    }),
}).superRefine((data, ctx) => {
    if (new Date(data.scheduledEndTime).getTime() <= new Date(data.scheduledStartTime).getTime()) {
        ctx.addIssue({
            code: 'custom',
            message: 'Giờ kết thúc phải sau giờ bắt đầu',
            path: ['scheduledEndTime'],
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

const tripTypeOptions: { value: TripType; label: string }[] = [
    {value: 'PICKUP', label: 'Đón'},
    {value: 'DROPOFF', label: 'Trả'},
]

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
            tripType: initialData?.tripType || 'PICKUP',
            scheduledStartTime: initialData ? toDatetimeLocalValue(initialData.scheduledStartTime) : '',
            scheduledEndTime: initialData ? toDatetimeLocalValue(initialData.scheduledEndTime) : '',
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
                tripType: 'PICKUP',
                scheduledStartTime: '',
                scheduledEndTime: '',
                status: 'SCHEDULED',
            })
            return
        }

        form.reset({
            routeId: initialData.routeId,
            busId: initialData.busId,
            driverId: initialData.driverId,
            tripType: initialData.tripType,
            scheduledStartTime: toDatetimeLocalValue(initialData.scheduledStartTime),
            scheduledEndTime: toDatetimeLocalValue(initialData.scheduledEndTime),
            status: initialData.status,
        })
    }, [initialData, form])

    const handleSubmit = async (data: BusTripFormValues) => {
        const payload = {
            routeId: data.routeId,
            busId: data.busId,
            driverId: data.driverId,
            tripType: data.tripType,
            scheduledStartTime: toIsoWithOffset(data.scheduledStartTime),
            scheduledEndTime: toIsoWithOffset(data.scheduledEndTime),
            status: data.status,
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
                        name="tripType"
                        control={form.control}
                        render={({field, fieldState}) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Loại chuyến <span className={'text-destructive'}>*</span></FieldLabel>
                                <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                                    <SelectTrigger aria-invalid={fieldState.invalid}>
                                        <SelectValue placeholder={'Chọn loại chuyến'}/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tripTypeOptions.map((option) => (
                                            <SelectItem key={option.value}
                                                        value={option.value}>{option.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                        name="scheduledStartTime"
                        control={form.control}
                        render={({field, fieldState}) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Giờ bắt đầu <span
                                    className={'text-destructive'}>*</span></FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type={'datetime-local'}
                                    aria-invalid={fieldState.invalid}
                                    disabled={isLoading}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]}/>}
                            </Field>
                        )}
                    />

                    <Controller
                        name="scheduledEndTime"
                        control={form.control}
                        render={({field, fieldState}) => (
                            <Field data-invalid={fieldState.invalid}>
                                <FieldLabel htmlFor={field.name}>Giờ kết thúc <span
                                    className={'text-destructive'}>*</span></FieldLabel>
                                <Input
                                    {...field}
                                    id={field.name}
                                    type={'datetime-local'}
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
