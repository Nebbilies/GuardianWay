'use client'

import {useState} from 'react'
import {Edit2, Trash2, RotateCcw} from 'lucide-react'
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
import {UserWithProfiles, PaginatedResponse} from '@/types/types'

const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    STAFF: 'Nhân viên',
    DRIVER: 'Tài xế',
    STUDENT: 'Học sinh',
    PARENT: 'Phụ huynh',
}

interface UsersListProps {
    users: PaginatedResponse<UserWithProfiles>
    onEdit: (user: UserWithProfiles) => void
    onDelete: (id: string) => Promise<void>
    onRestore: (id: string) => Promise<void>
    onSortChange: (sortBy: string) => void
    sortBy: string
    sortOrder: 'asc' | 'desc'
    isDeleting: boolean
    isRestoring: boolean
    isDeletedMode: boolean
}

export default function UsersList({
                                      users,
                                      onEdit,
                                      onDelete,
                                      onRestore,
                                      onSortChange,
                                      sortBy,
                                      sortOrder,
                                      isDeleting,
                                      isRestoring,
                                      isDeletedMode,
                                  }: UsersListProps) {
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
    const [restoringUserId, setRestoringUserId] = useState<string | null>(null)

    if (!users?.data || users.data.length === 0) {
        return (
            <Empty>
                <EmptyTitle>
                    Không có người dùng nào.
                </EmptyTitle>
                <EmptyDescription>
                    {isDeletedMode ? 'Không có tài khoản đã xóa.' : 'Hãy thêm một người dùng mới.'}
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
                        <SortHeader label="Họ tên" sortKeyValue="name" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Email" sortKeyValue="email" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Vai trò" sortKeyValue="role" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-left text-sm text-foreground font-semibold">
                        Số điện thoại
                    </th>
                    <th className="px-6 py-3 text-left text-sm">
                        <SortHeader label="Ngày tạo" sortKeyValue="createdAt" sortBy={sortBy} sortOrder={sortOrder}
                                    onSortChange={onSortChange}/>
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                        Hành động
                    </th>
                </tr>
                </thead>
                <tbody>
                {users.data.map((user) => (
                    <tr
                        key={user.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                            {user.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                            {user.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                            {ROLE_LABELS[user.role] || user.role}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                            {user.phoneNumber || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                            {new Date(user.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                            <div className="flex justify-end gap-2">
                                {isDeletedMode ? (
                                    <AlertDialog
                                        open={restoringUserId === user.id}
                                        onOpenChange={(open) => !open && setRestoringUserId(null)}
                                    >
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                disabled={isRestoring}
                                                onClick={() => setRestoringUserId(user.id)}
                                                className="text-primary hover:text-primary"
                                            >
                                                <RotateCcw className="w-4 h-4"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Bạn có chắc chắn muốn khôi phục?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Người dùng <strong>{user.name}</strong> ({user.email}) sẽ được khôi
                                                    phục về trạng thái hoạt động.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel disabled={isRestoring}>Hủy</AlertDialogCancel>
                                                <Button
                                                    disabled={isRestoring}
                                                    onClick={async (e) => {
                                                        e.preventDefault()
                                                        try {
                                                            await onRestore(user.id)
                                                            setRestoringUserId(null)
                                                        } catch (error) {
                                                            console.error(error)
                                                        }
                                                    }}
                                                >
                                                    {isRestoring ? "Đang khôi phục..." : "Khôi phục"}
                                                </Button>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(user)}
                                            className="text-primary hover:text-primary"
                                        >
                                            <Edit2 className="w-4 h-4"/>
                                        </Button>
                                        <AlertDialog open={deletingUserId === user.id}
                                                     onOpenChange={(open) => !open && setDeletingUserId(null)}>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={isDeleting}
                                                    onClick={() => setDeletingUserId(user.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4"/>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Người dùng <strong>{user.name}</strong> ({user.email}) sẽ bị xóa
                                                        khỏi hệ
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
                                                                await onDelete(user.id)
                                                                setDeletingUserId(null)
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
