'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { AuditLog, PaginatedResponse } from '@/types/types'
import { apiRequest } from '@/lib/api-client'
import AuditLogTable from '@/components/custom/audit-log-table'
import CustomPagination from '@/components/custom/custom-pagination'
import TableSkeleton from '@/components/custom/table-skeleton'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const fetcher = <T,>(url: string) => apiRequest<T>(url)

const ACTION_OPTIONS = [
    { value: 'ALL', label: 'Tất cả hành động' },
    { value: 'auth.login', label: 'Đăng nhập' },
    { value: 'auth.login_failed', label: 'Đăng nhập thất bại' },
    { value: 'user.created', label: 'Tạo người dùng' },
    { value: 'user.updated', label: 'Cập nhật người dùng' },
    { value: 'user.deactivated', label: 'Vô hiệu hóa người dùng' },
    { value: 'bus.created', label: 'Tạo xe buýt' },
    { value: 'busRoute.created', label: 'Tạo tuyến đường' },
    { value: 'busStop.created', label: 'Tạo điểm dừng' },
    { value: 'student.created', label: 'Tạo học sinh' },
    { value: 'student.card_assigned', label: 'Gán thẻ học sinh' },
]

export default function AdminAuditPage() {
    const [action, setAction] = useState('ALL')
    const [targetId, setTargetId] = useState('')
    const [currentPage, setCurrentPage] = useState(1)

    const params = new URLSearchParams()
    if (action !== 'ALL') params.set('action', action)
    if (targetId.trim()) params.set('targetId', targetId.trim())
    if (currentPage > 1) params.set('page', currentPage.toString())

    const { data, error, isLoading } = useSWR<PaginatedResponse<AuditLog>>(
        `/audit-logs?${params.toString()}`, fetcher,
    )

    if (error) {
        return <div className={'p-8 bg-background'}>Lỗi khi tải dữ liệu: {error.message}</div>
    }

    return (
        <div className={'p-8 bg-background'}>
            <div className={'mb-8'}>
                <h1 className={'text-4xl font-bold text-foreground'}>Nhật ký kiểm toán</h1>
                <p className={'text-muted-foreground mt-2'}>Lịch sử hoạt động trong trường của bạn</p>
            </div>
            <div className={'flex gap-4 mb-6'}>
                <Select value={action} onValueChange={(v) => { setAction(v); setCurrentPage(1) }}>
                    <SelectTrigger className={'w-56'}><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {ACTION_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Input
                    placeholder={'Lọc theo mã đối tượng...'}
                    value={targetId}
                    onChange={(e) => { setTargetId(e.target.value); setCurrentPage(1) }}
                    className={'w-72'}
                />
            </div>
            {isLoading || !data ? (
                <TableSkeleton columns={4} />
            ) : (
                <>
                    <AuditLogTable logs={data} />
                    <div className={'mt-4 flex justify-end'}>
                        <CustomPagination paginationData={data.metadata} onPageChange={setCurrentPage} />
                    </div>
                </>
            )}
        </div>
    )
}
