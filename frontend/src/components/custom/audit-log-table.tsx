'use client'

import { AuditLog, PaginatedResponse } from '@/types/types'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty'

const ACTION_LABELS: Record<string, string> = {
    'auth.login': 'Đăng nhập',
    'auth.login_failed': 'Đăng nhập thất bại',
    'invite.issued': 'Gửi lời mời',
    'password.setup': 'Thiết lập mật khẩu',
    'school.created': 'Tạo trường',
    'school.updated': 'Cập nhật trường',
    'school.deleted': 'Xóa trường',
    'school.restored': 'Khôi phục trường',
    'admin.onboarded': 'Thêm quản trị viên',
    'user.created': 'Tạo người dùng',
    'user.updated': 'Cập nhật người dùng',
    'user.deactivated': 'Vô hiệu hóa người dùng',
    'user.restored': 'Khôi phục người dùng',
    'bus.created': 'Tạo xe buýt',
    'bus.updated': 'Cập nhật xe buýt',
    'bus.deleted': 'Xóa xe buýt',
    'busRoute.created': 'Tạo tuyến đường',
    'busRoute.updated': 'Cập nhật tuyến đường',
    'busRoute.deleted': 'Xóa tuyến đường',
    'busStop.created': 'Tạo điểm dừng',
    'busStop.updated': 'Cập nhật điểm dừng',
    'busStop.deleted': 'Xóa điểm dừng',
    'student.created': 'Tạo học sinh',
    'student.updated': 'Cập nhật học sinh',
    'student.deleted': 'Xóa học sinh',
    'student.card_assigned': 'Gán thẻ học sinh',
}

function actionLabel(action: string) {
    return ACTION_LABELS[action] ?? action
}

function isDestructive(action: string) {
    return action.endsWith('.deleted') || action.endsWith('_failed') || action.endsWith('.deactivated')
}

interface AuditLogTableProps {
    logs: PaginatedResponse<AuditLog>
    showSchoolColumn?: boolean
    schoolNameById?: Record<string, string>
}

export default function AuditLogTable({ logs, showSchoolColumn = false, schoolNameById = {} }: AuditLogTableProps) {
    if (!logs?.data || logs.data.length === 0) {
        return (
            <Empty>
                <EmptyTitle>Không có bản ghi nào.</EmptyTitle>
                <EmptyDescription>Chưa có hoạt động nào được ghi lại.</EmptyDescription>
            </Empty>
        )
    }

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
                <thead>
                <tr className="border-b border-border bg-muted">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Thời gian</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Hành động</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Người thực hiện</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Đối tượng</th>
                    {showSchoolColumn && (
                        <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Trường</th>
                    )}
                </tr>
                </thead>
                <tbody>
                {logs.data.map((row) => (
                    <tr key={row.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-foreground">
                            {new Date(row.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                            <Badge variant={isDestructive(row.action) ? 'destructive' : 'secondary'}>
                                {actionLabel(row.action)}
                            </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm">
                            <div className="flex flex-col">
                                <span className="text-foreground">{row.actorEmail ?? '—'}</span>
                                {row.actorRole && (
                                    <span className="text-muted-foreground text-xs">{row.actorRole}</span>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                            {row.targetType
                                ? `${row.targetType}${row.targetId ? ` · ${row.targetId.slice(0, 8)}` : ''}`
                                : '—'}
                        </td>
                        {showSchoolColumn && (
                            <td className="px-6 py-4 text-sm text-foreground">
                                {row.schoolId ? (schoolNameById[row.schoolId] ?? row.schoolId.slice(0, 8)) : 'Hệ thống'}
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}
