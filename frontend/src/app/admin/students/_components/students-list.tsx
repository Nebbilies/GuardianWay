'use client'

import {useState} from 'react'
import {CreditCard, Edit2, RotateCcw, Trash2} from 'lucide-react'
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
import {PaginatedResponse, StudentWithParent} from '@/types/types'
import {CardStatusBadge} from '@/components/custom/status-badge'

interface StudentsListProps {
    students: PaginatedResponse<StudentWithParent>
    onEdit: (student: StudentWithParent) => void
    onDelete: (id: string) => Promise<void>
    onRestore: (id: string) => Promise<void>
    onManageCard: (student: StudentWithParent) => void
    onSortChange: (sortBy: string) => void
    sortBy: string
    sortOrder: 'asc' | 'desc'
    isDeleting: boolean
    isRestoring: boolean
    isDeletedMode: boolean
}

const formatDate = (value: string) => new Date(value).toLocaleDateString('vi-VN')

export default function StudentsList({
                                         students,
                                         onEdit,
                                         onDelete,
                                         onRestore,
                                         onManageCard,
                                         onSortChange,
                                         sortBy,
                                         sortOrder,
                                         isDeleting,
                                         isRestoring,
                                         isDeletedMode,
                                     }: StudentsListProps) {
    const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null)
    const [restoringStudentId, setRestoringStudentId] = useState<string | null>(null)

    if (!students?.data || students.data.length === 0) {
        return (
            <Empty>
                <EmptyTitle>
                    Không có học sinh nào.
                </EmptyTitle>
                <EmptyDescription>
                    {isDeletedMode ? 'Không có học sinh đã xóa.' : 'Hãy thêm một học sinh mới.'}
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
                        <SortHeader label="Họ tên" sortKeyValue="fullName" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Mã học sinh" sortKeyValue="studentId" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Lớp" sortKeyValue="studentClass" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-left text-sm text-foreground font-semibold">Ngày sinh</th>
                    <th className="px-6 py-3 text-left text-sm text-foreground font-semibold">Phụ huynh</th>
                    <th className="px-6 py-3 text-left text-sm text-foreground font-semibold">Thẻ</th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Ngày tạo" sortKeyValue="createdAt" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Hành động</th>
                </tr>
                </thead>
                <tbody>
                {students.data.map((student) => (
                    <tr
                        key={student.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{student.fullName}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{student.studentId}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{student.studentClass}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{formatDate(student.dateOfBirth)}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{student.parent?.name ?? '—'}</td>
                        <td className="px-6 py-4 text-sm text-foreground">
                            <CardStatusBadge assigned={!!student.cardTokenHash}/>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{formatDate(student.createdAt)}</td>
                        <td className="px-6 py-4 text-sm text-right">
                            <div className="flex justify-end gap-2">
                                {isDeletedMode ? (
                                    <AlertDialog
                                        open={restoringStudentId === student.id}
                                        onOpenChange={(open) => !open && setRestoringStudentId(null)}
                                    >
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={isRestoring}
                                                onClick={() => setRestoringStudentId(student.id)}
                                                className="text-primary hover:text-primary"
                                            >
                                                <RotateCcw className="w-4 h-4"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Bạn có chắc chắn muốn khôi phục?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Học sinh <strong>{student.fullName}</strong> ({student.studentId})
                                                    sẽ
                                                    được khôi phục về trạng thái hoạt động.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel disabled={isRestoring}>Hủy</AlertDialogCancel>
                                                <Button
                                                    disabled={isRestoring}
                                                    onClick={async (e) => {
                                                        e.preventDefault()
                                                        try {
                                                            await onRestore(student.id)
                                                            setRestoringStudentId(null)
                                                        } catch (error) {
                                                            console.error(error)
                                                        }
                                                    }}
                                                >
                                                    {isRestoring ? 'Đang khôi phục...' : 'Khôi phục'}
                                                </Button>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onManageCard(student)}
                                            className="text-foreground hover:text-foreground"
                                            title="Quản lý thẻ"
                                        >
                                            <CreditCard className="w-4 h-4"/>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(student)}
                                            className="text-primary hover:text-primary"
                                        >
                                            <Edit2 className="w-4 h-4"/>
                                        </Button>
                                        <AlertDialog open={deletingStudentId === student.id}
                                                     onOpenChange={(open) => !open && setDeletingStudentId(null)}>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={isDeleting}
                                                    onClick={() => setDeletingStudentId(student.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4"/>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Học
                                                        sinh <strong>{student.fullName}</strong> ({student.studentId})
                                                        sẽ bị xóa khỏi hệ thống.
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
                                                                await onDelete(student.id)
                                                                setDeletingStudentId(null)
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
