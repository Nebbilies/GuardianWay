'use client'

import React, {useEffect, useMemo, useState} from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {Field, FieldLabel, FieldError, FieldDescription} from '@/components/ui/field'
import {BusRoute, BusRouteWithStops, BusStop, RouteStop} from "@/types/types";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {GripVertical, Trash2} from "lucide-react";
import MapComponent from "@/app/(landing)/map/MapComponent";

const routeStopSchema = z.array(z.object({
    stopId: z.string().min(1, "Vui lòng chọn một điểm dừng"),
    stopOrder: z.number().min(1, "Thứ tự phải là số nguyên dương"),
    scheduledTime: z.date().optional(),
})).min(2, "Tuyến đường phải có ít nhất 2 điểm dừng")

const busRouteSchema = z.object({
    name: z.string().min(1, "Vui lòng nhập tên tuyến đường"),
    description: z.string().max(500, "Mô tả không được vượt quá 500 ký tự").optional(),
    stops: routeStopSchema,
})

export type BusRouteFormValues = z.infer<typeof busRouteSchema>
export type RouteStopFormValues = z.infer<typeof routeStopSchema>

interface BusRouteFormProps {
    busStops: BusStop[]
    initialData?: BusRouteWithStops
    onSubmit: (data: BusRouteFormValues & { id?: string }) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
}

export default function BusRouteForm({
                                        initialData,
                                        busStops,
                                        onSubmit,
                                        onCancel,
                                        isLoading = false,
                                    }: BusRouteFormProps) {
    const [selectedStops, setSelectedStops] = useState<RouteStopFormValues>(
        (initialData?.routeStops ?? []).map((stop) => ({
            stopId: stop.stopId,
            stopOrder: stop.stopOrder,
            scheduledTime: stop.scheduledTime ? new Date(stop.scheduledTime) : undefined,
        }))
    )
    const [selectedStopForAdd, setSelectedStopForAdd] = useState<string>('')
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

    const form = useForm<BusRouteFormValues>({
        resolver: zodResolver(busRouteSchema),
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            stops: initialData?.routeStops.map(stop => ({
                stopId: stop.stopId,
                stopOrder: stop.stopOrder,
                scheduledTime: stop.scheduledTime ? new Date(stop.scheduledTime) : undefined,
            })) || [],
        },
        mode: 'onChange',
    })

    const availableStops = useMemo(
        () => busStops.filter(stop => !selectedStops.some(
            s => s.stopId === stop.id
        )), [selectedStops, busStops]
    )

    const handleAddStop = () => {
        if (selectedStopForAdd && !selectedStops.some(s => s.stopId === selectedStopForAdd)) {
            const newStops: RouteStopFormValues = [...selectedStops, {
                stopId: selectedStopForAdd,
                stopOrder: selectedStops.length + 1,
                scheduledTime: undefined,
            }]
            setSelectedStops(newStops)
            form.setValue('stops', newStops)
            setSelectedStopForAdd('')
        }
    }

    const handleRemoveStop = (stopId: string) => {
        const newStops: RouteStopFormValues = selectedStops
            .filter(s => s.stopId !== stopId)
            .map((s, index) => ({ ...s, stopOrder: index + 1 }))
        setSelectedStops(newStops)
        form.setValue('stops', newStops)
    }

    const handleUpdateScheduledTime = (stopId: string, time: Date) => {
        const newStops: RouteStopFormValues = selectedStops.map(s => s.stopId === stopId ? { ...s, scheduledTime: time } : s)
        setSelectedStops(newStops)
        form.setValue('stops', newStops)
    }

    const handleDragStart = (index: number) => {
        setDraggedIndex(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (draggedIndex === null || draggedIndex === index) return

        const newStops = [...selectedStops]
        const [movedStop] = newStops.splice(draggedIndex, 1)
        newStops.splice(index, 0, movedStop)
        const reorderedStops: RouteStopFormValues = newStops.map((stop, orderIndex) => ({
            ...stop,
            stopOrder: orderIndex + 1,
        }))
        setSelectedStops(reorderedStops)
        form.setValue('stops', reorderedStops)
        setDraggedIndex(index)
    }

    const handleDragEnd = () => {
        setDraggedIndex(null)
    }

    useEffect(() => {
        if (!initialData) return

        const mappedStops: BusRouteFormValues["stops"] = (initialData.routeStops ?? []).map(
            (stop) => ({
                stopId: stop.stopId,
                stopOrder: stop.stopOrder,
                scheduledTime: stop.scheduledTime ? new Date(stop.scheduledTime) : undefined,
            })
        )

        form.reset({
            name: initialData.name ?? "",
            description: initialData.description ?? "",
            stops: mappedStops,
        })
        setSelectedStops(mappedStops)
    }, [initialData, form])


    const handleSubmit = async (data: BusRouteFormValues) => {
        if (initialData?.id) {
            await onSubmit({ ...data, id: initialData.id as string })
        } else {
            await onSubmit(data)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className={'space-y-6'}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className={'space-y-6'}>
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
                    <div className={'space-y-2'}>
                        <FieldLabel>
                            Vị trí các trạm
                        </FieldLabel>
                        <FieldDescription>
                            Các trạm dừng đã chọn sẽ được hiển thị trên map.
                        </FieldDescription>
                        <MapComponent
                            mapHeight={300}
                            stopLocations={selectedStops.map(s => {
                                const stop = busStops.find(stop => stop.id === s.stopId)
                                return stop ? { lat: stop.latitude, lng: stop.longitude } : null
                            }).filter(Boolean) as { lat: number, lng: number }[]}
                        />
                    </div>
                </div>
                <div className={'space-y-4'}>
                    <FieldLabel className={'mb-3'}>
                        Quản lý điểm dừng
                        <span className={'text-destructive'}>*</span>
                    </FieldLabel>
                    <div className={'flex gap-2'}>
                        <Select value={selectedStopForAdd} onValueChange={setSelectedStopForAdd}>
                            <SelectTrigger className={'flex-1'} disabled={isLoading || availableStops.length === 0}>
                                <SelectValue placeholder="Chọn trạm dừng để thêm" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableStops.map(stop => (
                                    <SelectItem value={stop.id} key={stop.id}>
                                        {stop.name} ({stop.isSchoolStop ? 'Trạm trường học' : 'Trạm thường'})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            type={"button"}
                            onClick={handleAddStop}
                            disabled={isLoading || !selectedStopForAdd || availableStops.length === 0}
                        >
                            Thêm
                        </Button>
                    </div>
                    {form.formState.errors.stops?.message && (
                        <p className="text-sm text-destructive">{form.formState.errors.stops.message}</p>
                    )}
                    {selectedStops.length > 0 && (
                        <div className="max-h-120 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                            {selectedStops.map((stop, index) => (
                                <div
                                    key={stop.stopId}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex flex-col gap-3 p-3 cursor-move transition-colors ${
                                        draggedIndex === index ? 'opacity-50 bg-accent/20' : 'hover:bg-muted/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-foreground">{index + 1}. {busStops.find(s => s.id === stop.stopId)?.name || 'Trạm không xác định'}</div>
                                            <div className="text-sm text-muted-foreground truncate">{busStops.find(s => s.id === stop.stopId)?.address || 'Địa chỉ không xác định'}</div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveStop(stop.stopId)}
                                            disabled={isLoading}
                                            className="text-destructive hover:text-destructive shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="ml-7">
                                        <Input
                                            type="time"
                                            placeholder="Scheduled time"
                                            value={stop.scheduledTime ? new Date(stop.scheduledTime).toISOString().substring(11, 16) : ''}
                                            onChange={(e) => {
                                                const time = e.target.value;
                                                const [hours, minutes] = time.split(':').map(Number);
                                                const scheduledTime = new Date();
                                                scheduledTime.setHours(hours, minutes, 0, 0);
                                                handleUpdateScheduledTime(stop.stopId, scheduledTime);
                                            }}
                                            disabled={isLoading}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
                    {isLoading ? 'Đang lưu...' : initialData ? 'Cập nhật tuyến' : 'Tạo tuyến mới'}
                </Button>
            </div>
        </form>
    )
}