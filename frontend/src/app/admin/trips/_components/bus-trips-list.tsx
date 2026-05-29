'use client'

import {useState} from 'react'
import {Edit2, Trash2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {SortHeader} from '@/components/custom/sort-header'
import {Empty, EmptyDescription, EmptyTitle} from '@/components/ui/empty'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {BusTripStatus, BusTripWithDetails, PaginatedResponse} from '@/types/types'

interface BusTripsListProps {
    busTrips: PaginatedResponse<BusTripWithDetails>
    onEdit: (busTrip: BusTripWithDetails) => void
    onDelete: (id: string) => Promise<void>
    onSortChange: (sortBy: string) => void
    sortBy: string
    sortOrder: 'asc' | 'desc'
    isDeleting: boolean
}

const statusLabelMap: Record<BusTripStatus, string> = {
    SCHEDULED: 'Đã lên lịch',
    IN_PROGRESS: 'Đang chạy',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
}

const formatDate = (value: Date | string) => {
    return new Date(value).toLocaleDateString('vi-VN')
}

const formatTime = (value: Date | string | null | undefined) => {
    if (!value) return '—'
    return new Date(value).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})
}

export default function BusTripsList({
                                         busTrips,
                                         onEdit,
                                         onDelete,
                                         onSortChange,
                                         sortBy,
                                         sortOrder,
                                         isDeleting,
                                     }: BusTripsListProps) {
    const [deletingTripId, setDeletingTripId] = useState<string | null>(null)

    if (!busTrips?.data || busTrips.data.length === 0) {
        return (
            <Empty>
                <EmptyTitle>
                    Không có chuyến đi nào.
                </EmptyTitle>
                <EmptyDescription>
                    Hãy tạo một chuyến đi mới.
                </EmptyDescription>
            </Empty>
        )
    }

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
                <thead>
                <tr className="border-b border-border bg-muted">
                    <th className="px-6 py-3 text-left text-sm">Tuyến đường</th>
                    <th className="px-6 py-3 text-left text-sm">Xe buýt</th>
                    <th className="px-6 py-3 text-left text-sm">Tài xế</th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Ngày chạy" sortKeyValue="date" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Giờ bắt đầu" sortKeyValue="startTime" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-left text-sm">Giờ kết thúc</th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Trạng thái" sortKeyValue="status" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Đã tạo" sortKeyValue="createdAt" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Hành động</th>
                </tr>
                </thead>
                <tbody>
                {busTrips.data.map((trip) => (
                    <tr
                        key={trip.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                        <td className="px-6 py-4 text-sm text-foreground">{trip.route.name}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{trip.bus.licensePlate}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{trip.driver.user.name}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{formatDate(trip.date)}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{formatTime(trip.startTime)}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{formatTime(trip.endTime)}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{statusLabelMap[trip.status]}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{new Date(trip.createdAt).toLocaleString('vi-VN')}</td>
                        <td className="px-6 py-4 text-sm text-right">
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(trip)}
                                    className="text-primary hover:text-primary"
                                >
                                    <Edit2 className="w-4 h-4"/>
                                </Button>
                                <AlertDialog open={deletingTripId === trip.id}
                                             onOpenChange={(open) => !open && setDeletingTripId(null)}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={isDeleting}
                                            onClick={() => setDeletingTripId(trip.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Chuyến đi của tuyến <strong>{trip.route.name}</strong> sẽ bị xóa khỏi hệ
                                                thống.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                                            <Button
                                                variant={'destructive'}
                                                disabled={isDeleting}
                                                onClick={async (e) => {
                                                    e.preventDefault()
                                                    try {
                                                        await onDelete(trip.id)
                                                        setDeletingTripId(null)
                                                    } catch (error) {
                                                        console.error(error)
                                                    }
                                                }}
                                            >
                                                {isDeleting ? 'Đang xóa...' : 'Xóa'}
                                            </Button>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}
