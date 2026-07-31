'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { AuditLog, PaginatedResponse, School } from '@/types/types'
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
    { value: 'school.created', label: 'Tạo trường' },
    { value: 'school.updated', label: 'Cập nhật trường' },
    { value: 'school.deleted', label: 'Xóa trường' },
    { value: 'admin.onboarded', label: 'Thêm quản trị viên' },
    { value: 'user.created', label: 'Tạo người dùng' },
    { value: 'user.deactivated', label: 'Vô hiệu hóa người dùng' },
]

export default function PlatformAuditPage() {
    const [action, setAction] = useState('ALL')
    const [schoolId, setSchoolId] = useState('ALL')
    const [targetId, setTargetId] = useState('')
    const [currentPage, setCurrentPage] = useState(1)

    const { data: schools } = useSWR<PaginatedResponse<School>>(`/schools?limit=100`, fetcher)
    const schoolNameById: Record<string, string> = {}
    schools?.data.forEach((s) => { schoolNameById[s.id] = s.name })

    const params = new URLSearchParams()
    if (action !== 'ALL') params.set('action', action)
    if (schoolId !== 'ALL') params.set('schoolId', schoolId)
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
                <p className={'text-muted-foreground mt-2'}>Lịch sử hoạt động toàn hệ thống</p>
            </div>
            <div className={'flex gap-4 mb-6 flex-wrap'}>
                <Select value={schoolId} onValueChange={(v) => { setSchoolId(v); setCurrentPage(1) }}>
                    <SelectTrigger className={'w-56'}><SelectValue placeholder={'Trường'} /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={'ALL'}>Tất cả trường</SelectItem>
                        {schools?.data.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                </Select>
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
                <TableSkeleton columns={5} />
            ) : (
                <>
                    <AuditLogTable logs={data} showSchoolColumn schoolNameById={schoolNameById} />
                    <div className={'mt-4 flex justify-end'}>
                        <CustomPagination paginationData={data.metadata} onPageChange={setCurrentPage} />
                    </div>
                </>
            )}
        </div>
    )
}
