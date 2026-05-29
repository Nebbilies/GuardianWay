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
import {BusStop, PaginatedResponse} from '@/types/types'

interface BusStopsListProps {
    busStops: PaginatedResponse<BusStop>
    onEdit: (busStop: BusStop) => void
    onDelete: (id: string) => Promise<void>
    onSortChange: (sortBy: string) => void
    sortBy: string
    sortOrder: 'asc' | 'desc'
    isDeleting: boolean;
}

export default function BusStopsList({
                                         busStops,
                                         onEdit,
                                         onDelete,
                                         onSortChange,
                                         sortBy,
                                         sortOrder,
                                         isDeleting,
                                     }: BusStopsListProps) {
    const [deletingStopId, setDeletingStopId] = useState<string | null>(null)

    if (!busStops?.data || busStops.data.length === 0) {
        return (
            <Empty>
                <EmptyTitle>
                    Không có điểm dừng nào.
                </EmptyTitle>
                <EmptyDescription>
                    Hãy thêm một điểm dừng mới.
                </EmptyDescription>
            </Empty>
        )
    }

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
                <thead>
                <tr className="border-b border-border bg-muted">
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Tên trạm dừng" sortKeyValue="name" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Địa chỉ" sortKeyValue="address" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-left text-sm text-foreground font-semibold">
                        Tọa độ
                    </th>
                    <th className="px-6 py-3 text-left text-sm text-foreground font-semibold">
                        Trạm trường học
                    </th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Đã tạo" sortKeyValue="createdAt" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                        Hành động
                    </th>
                </tr>
                </thead>
                <tbody>
                {busStops.data.map((busStop) => (
                    <tr
                        key={busStop.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                            {busStop.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                            {busStop.address}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                            {busStop.latitude && busStop.longitude
                                ? `${busStop.latitude.toFixed(4)}, ${busStop.longitude.toFixed(4)}`
                                : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                            {busStop.isSchoolStop ? 'Yes' : 'No'}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                            {new Date(busStop.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(busStop)}
                                    className="text-primary hover:text-primary"
                                >
                                    <Edit2 className="w-4 h-4"/>
                                </Button>
                                <AlertDialog open={deletingStopId === busStop.id}
                                             onOpenChange={(open) => !open && setDeletingStopId(null)}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={isDeleting}
                                            onClick={() => setDeletingStopId(busStop.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Trạm dừng <strong>{busStop.name}</strong> sẽ bị xóa khỏi hệ thống.
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
                                                        await onDelete(busStop.id)
                                                        setDeletingStopId(null)
                                                    } catch (error) {
                                                        console.error(error)
                                                    }
                                                }}
                                            >
                                                {isDeleting ? "Đang xóa..." : "Xóa"}
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
