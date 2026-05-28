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
import {BusRouteWithStops, PaginatedResponse} from '@/types/types'

interface BusRoutesListProps {
    busRoutes: PaginatedResponse<BusRouteWithStops>
    onEdit: (busRoute: BusRouteWithStops) => void
    onDelete: (id: string) => Promise<void>
    onSortChange: (sortBy: string) => void
    sortBy: string
    sortOrder: 'asc' | 'desc'
    isDeleting: boolean;
}

export default function BusRoutesList({
                                         busRoutes,
                                         onEdit,
                                         onDelete,
                                         onSortChange,
                                         sortBy,
                                         sortOrder,
                                         isDeleting,
                                     }: BusRoutesListProps) {
    const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null)

    if (!busRoutes?.data || busRoutes.data.length === 0) {
        return (
            <Empty>
                <EmptyTitle>
                    Không có tuyến đường nào.
                </EmptyTitle>
                <EmptyDescription>
                    Hãy thêm một tuyến đường mới.
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
                        <SortHeader label="Tên tuyến đường" sortKeyValue="name" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-left text-sm">
                        Trạm dừng
                    </th>
                    <th className="px-6 py-3 text-left text-sm">
                        Mô tả
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                        Hành động
                    </th>
                </tr>
                </thead>
                <tbody>
                {busRoutes.data.map((busRoute) => (
                    <tr
                        key={busRoute.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                            {busRoute.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                             {busRoute.routeStops.map((routeStop) => routeStop.stop.name).join(' → ')}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                            {busRoute.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(busRoute)}
                                    className="text-primary hover:text-primary"
                                >
                                    <Edit2 className="w-4 h-4"/>
                                </Button>
                                <AlertDialog open={deletingRouteId === busRoute.id}
                                             onOpenChange={(open) => !open && setDeletingRouteId(null)}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={isDeleting}
                                            onClick={() => setDeletingRouteId(busRoute.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Tuyến đường <strong>{busRoute.name}</strong> sẽ bị xóa khỏi hệ thống.
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
                                                        await onDelete(busRoute.id)
                                                        setDeletingRouteId(null)
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
