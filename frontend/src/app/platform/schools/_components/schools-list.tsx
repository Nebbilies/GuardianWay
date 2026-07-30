'use client'

import { useState } from 'react'
import { Edit2, Trash2, RotateCcw, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SortHeader } from '@/components/custom/sort-header'
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty'
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
import { School, PaginatedResponse } from '@/types/types'
import { SchoolStatusBadge } from '@/components/custom/status-badge'

interface SchoolsListProps {
    schools: PaginatedResponse<School>
    onEdit: (school: School) => void
    onManageAdmins: (school: School) => void
    onDelete: (id: string) => Promise<void>
    onRestore: (id: string) => Promise<void>
    onSortChange: (sortBy: string) => void
    sortBy: string
    sortOrder: 'asc' | 'desc'
    isDeleting: boolean
    isRestoring: boolean
    isDeletedMode: boolean
}

export default function SchoolsList({
    schools,
    onEdit,
    onManageAdmins,
    onDelete,
    onRestore,
    onSortChange,
    sortBy,
    sortOrder,
    isDeleting,
    isRestoring,
    isDeletedMode,
}: SchoolsListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [restoringId, setRestoringId] = useState<string | null>(null)

    if (!schools?.data || schools.data.length === 0) {
        return (
            <Empty>
                <EmptyTitle>Không có trường học nào.</EmptyTitle>
                <EmptyDescription>
                    {isDeletedMode ? 'Không có trường học đã xóa.' : 'Hãy thêm một trường học mới.'}
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
                        <SortHeader label="Tên trường" sortKeyValue="name" sortBy={sortBy} sortOrder={sortOrder} onSortChange={onSortChange} />
                    </th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Slug" sortKeyValue="slug" sortBy={sortBy} sortOrder={sortOrder} onSortChange={onSortChange} />
                    </th>
                    <th className="px-6 py-3 text-left text-sm text-foreground font-semibold">Địa chỉ</th>
                    <th className="px-6 py-3 text-left text-sm text-foreground font-semibold">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Ngày tạo" sortKeyValue="createdAt" sortBy={sortBy} sortOrder={sortOrder} onSortChange={onSortChange} />
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Hành động</th>
                </tr>
                </thead>
                <tbody>
                {schools.data.map((school) => (
                    <tr key={school.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{school.name}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{school.slug}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{school.address}</td>
                        <td className="px-6 py-4 text-sm">
                            <SchoolStatusBadge isActive={school.isActive} deleted={isDeletedMode} />
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{new Date(school.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-right">
                            <div className="flex justify-end gap-2">
                                {isDeletedMode ? (
                                    <AlertDialog open={restoringId === school.id} onOpenChange={(open) => !open && setRestoringId(null)}>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" disabled={isRestoring} onClick={() => setRestoringId(school.id)} className="text-primary hover:text-primary">
                                                <RotateCcw className="w-4 h-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Khôi phục trường học?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    <strong>{school.name}</strong> sẽ được khôi phục về trạng thái hoạt động.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel disabled={isRestoring}>Hủy</AlertDialogCancel>
                                                <Button disabled={isRestoring} onClick={async (e) => {
                                                    e.preventDefault()
                                                    try { await onRestore(school.id); setRestoringId(null) } catch (error) { console.error(error) }
                                                }}>
                                                    {isRestoring ? 'Đang khôi phục...' : 'Khôi phục'}
                                                </Button>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : (
                                    <>
                                        <Button variant="ghost" size="sm" onClick={() => onManageAdmins(school)} className="text-foreground" aria-label="Quản lý quản trị viên">
                                            <Users className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => onEdit(school)} className="text-primary hover:text-primary">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <AlertDialog open={deletingId === school.id} onOpenChange={(open) => !open && setDeletingId(null)}>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" disabled={isDeleting} onClick={() => setDeletingId(school.id)} className="text-destructive hover:text-destructive">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Xóa trường học?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        <strong>{school.name}</strong> sẽ bị xóa (có thể khôi phục). Dữ liệu của trường không bị xóa theo.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                                                    <Button variant={'destructive'} disabled={isDeleting} onClick={async (e) => {
                                                        e.preventDefault()
                                                        try { await onDelete(school.id); setDeletingId(null) } catch (error) { console.error(error) }
                                                    }}>
                                                        {isDeleting ? 'Đang xóa...' : 'Xóa'}
                                                    </Button>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}
