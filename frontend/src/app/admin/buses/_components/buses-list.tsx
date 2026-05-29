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
import {Bus, PaginatedResponse} from '@/types/types'

interface BusesListProps {
    buses: PaginatedResponse<Bus>
    onEdit: (bus: Bus) => void
    onDelete: (id: string) => Promise<void>
    onSortChange: (sortBy: string) => void
    sortBy: string
    sortOrder: 'asc' | 'desc'
    isDeleting: boolean;
}

export default function BusesList({
                                         buses,
                                         onEdit,
                                         onDelete,
                                         onSortChange,
                                         sortBy,
                                         sortOrder,
                                         isDeleting,
                                     }: BusesListProps) {
    const [deletingBusId, setDeletingBusId] = useState<string | null>(null)

    if (!buses?.data || buses.data.length === 0) {
        return (
            <Empty>
                <EmptyTitle>
                    Không có xe nào.
                </EmptyTitle>
                <EmptyDescription>
                    Hãy thêm một xe mới.
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
                        <SortHeader label="Biển số" sortKeyValue="licensePlate" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Mẫu xe" sortKeyValue="model" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-left text-sm text-foreground font-semibold">
                        <SortHeader label="Chỗ ngồi" sortKeyValue="capacity" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-left text-sm text-foreground font-semibold">
                        Trạng thái
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
                {buses.data.map((bus) => (
                    <tr
                        key={bus.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                            {bus.licensePlate}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                            {bus.model}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                            {bus.capacity}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                            {bus.status}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                            {new Date(bus.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEdit(bus)}
                                    className="text-primary hover:text-primary"
                                >
                                    <Edit2 className="w-4 h-4"/>
                                </Button>
                                <AlertDialog open={deletingBusId === bus.id}
                                             onOpenChange={(open) => !open && setDeletingBusId(null)}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={isDeleting}
                                            onClick={() => setDeletingBusId(bus.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Xe số <strong>{bus.licensePlate}</strong> sẽ bị xóa khỏi hệ thống.
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
                                                        await onDelete(bus.id)
                                                        setDeletingBusId(null)
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
