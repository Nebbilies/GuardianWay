'use client'

import { useState } from 'react'
import { Edit2, Trash2, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    isDeleting: boolean;
}

type SortKey = 'name' | 'address' | 'createdAt'
type SortOrder = 'asc' | 'desc'

export default function BusStopsList({
                                 busStops,
                                 onEdit,
                                 onDelete,
                                 isDeleting,
                             }: BusStopsListProps) {
    const [sortKey, setSortKey] = useState<SortKey>('createdAt')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
    const [deletingStopId, setDeletingStopId] = useState<string | null>(null)

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortOrder('asc')
        }
    }

    const SortHeader = ({ label, sortKeyValue }: { label: string; sortKeyValue: SortKey }) => (
        <button
            onClick={() => handleSort(sortKeyValue)}
            className="flex items-center gap-1 font-semibold text-foreground hover:text-primary transition-colors"
        >
            {label}
            {sortKey === sortKeyValue && (
                <ArrowUpDown className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
            )}
        </button>
    )

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
                        <SortHeader label="Name" sortKeyValue="name" />
                    </th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Address" sortKeyValue="address" />
                    </th>
                    <th className="px-6 py-3 text-left text-sm text-foreground font-semibold">
                        Location
                    </th>
                    <th className="px-6 py-3 text-left text-sm text-foreground font-semibold">
                        School Stop
                    </th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Created" sortKeyValue="createdAt" />
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                        Actions
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
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <AlertDialog open={deletingStopId === busStop.id} onOpenChange={(open) => !open && setDeletingStopId(null)}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={isDeleting}
                                            onClick={() => setDeletingStopId(busStop.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
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
