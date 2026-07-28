'use client'

import {Plus} from 'lucide-react'
import useSWR from 'swr'
import {useEffect, useState} from 'react'
import {toast} from 'sonner'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {FormDialog} from '@/components/custom/form-dialog'
import CustomPagination from '@/components/custom/custom-pagination'
import {PaginatedResponse, StudentWithParent} from '@/types/types'
import StudentsList from '@/app/admin/students/_components/students-list'
import StudentForm, {ParentOption, StudentFormValues} from '@/app/admin/students/_components/students-form'
import StudentCardDialog from '@/app/admin/students/_components/student-card-dialog'
import {apiRequest} from '@/lib/api-client'
import TableSkeleton from '@/components/custom/table-skeleton'

const fetcher = <T, >(url: string) => apiRequest<T>(url)

const ALL_PARENTS = 'ALL'

export default function StudentsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<StudentWithParent | undefined>()
    const [cardStudent, setCardStudent] = useState<StudentWithParent | null>(null)
    const [isCardDialogOpen, setIsCardDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isRestoring, setIsRestoring] = useState(false)
    const [isCardSubmitting, setIsCardSubmitting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [classFilter, setClassFilter] = useState('')
    const [debouncedClassFilter, setDebouncedClassFilter] = useState('')
    const [parentFilter, setParentFilter] = useState<string>(ALL_PARENTS)
    const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'DELETED_ONLY'>('ACTIVE')
    const [sortBy, setSortBy] = useState<string>('fullName')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
            setDebouncedClassFilter(classFilter)
        }, 500)

        return () => clearTimeout(delayDebounce)
    }, [searchTerm, classFilter])

    const params = new URLSearchParams()
    if (debouncedSearchTerm) {
        params.set('search', debouncedSearchTerm)
    }
    if (debouncedClassFilter) {
        params.set('studentClass', debouncedClassFilter)
    }
    if (parentFilter !== ALL_PARENTS) {
        params.set('parentId', parentFilter)
    }
    if (statusFilter === 'DELETED_ONLY') {
        params.set('deleted', 'only')
    }
    if (sortBy) {
        params.set('sort', sortOrder === 'desc' ? `-${sortBy}` : sortBy)
    }
    if (currentPage > 1) {
        params.set('page', currentPage.toString())
    }

    const {
        data: students,
        error,
        isLoading,
        mutate,
    } = useSWR<PaginatedResponse<StudentWithParent>>(`/students?${params.toString()}`, fetcher)

    const {data: parents} = useSWR<ParentOption[]>('/users/parents', fetcher)
    const parentOptions = parents ?? []

    const handleSortChange = (key: string) => {
        if (sortBy === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(key)
            setSortOrder('asc')
        }
        setCurrentPage(1)
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    if (error) {
        return <div className={'p-8 bg-background'}>Lỗi khi tải dữ liệu: {error.message}</div>
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setSelectedStudent(undefined)
    }

    const handleSubmit = async (data: StudentFormValues & { id?: string }) => {
        setIsSubmitting(true)
        try {
            const {id, ...payload} = data
            const url = id ? `/students/${id}` : `/students`
            const method = id ? 'PUT' : 'POST'
            await apiRequest(url, {
                method,
                body: JSON.stringify(payload),
            })

            await mutate()
            toast.success(`Học sinh đã được ${id ? 'cập nhật' : 'thêm'} thành công!`)
            handleCloseDialog()
        } catch (err) {
            console.error('Có lỗi khi lưu học sinh:', err)
            toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddStudent = () => {
        setSelectedStudent(undefined)
        setIsDialogOpen(true)
    }

    const handleEditStudent = (student: StudentWithParent) => {
        setSelectedStudent(student)
        setIsDialogOpen(true)
    }

    const handleDeleteStudent = async (id: string) => {
        setIsDeleting(true)
        try {
            await apiRequest(`/students/${id}`, {method: 'DELETE'})
            await mutate()
            toast.success('Học sinh đã được xóa thành công!')
        } catch (err) {
            console.error('Có lỗi khi xóa học sinh:', err)
            toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleRestoreStudent = async (id: string) => {
        setIsRestoring(true)
        try {
            await apiRequest(`/students/${id}/restore`, {method: 'PATCH'})
            await mutate()
            toast.success('Học sinh đã được khôi phục thành công!')
        } catch (err) {
            console.error('Có lỗi khi khôi phục học sinh:', err)
            toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
        } finally {
            setIsRestoring(false)
        }
    }

    const handleManageCard = (student: StudentWithParent) => {
        setCardStudent(student)
        setIsCardDialogOpen(true)
    }

    const handleAssignCard = async (cardId: string) => {
        if (!cardStudent) return
        setIsCardSubmitting(true)
        try {
            await apiRequest(`/students/${cardStudent.id}/card`, {
                method: 'PUT',
                body: JSON.stringify({cardId}),
            })
            await mutate()
            toast.success('Gán thẻ thành công!')
            setIsCardDialogOpen(false)
            setCardStudent(null)
        } catch (err) {
            console.error('Có lỗi khi gán thẻ:', err)
            toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
        } finally {
            setIsCardSubmitting(false)
        }
    }

    const handleRemoveCard = async () => {
        if (!cardStudent) return
        setIsCardSubmitting(true)
        try {
            await apiRequest(`/students/${cardStudent.id}/card`, {method: 'DELETE'})
            await mutate()
            toast.success('Gỡ thẻ thành công!')
            setIsCardDialogOpen(false)
            setCardStudent(null)
        } catch (err) {
            console.error('Có lỗi khi gỡ thẻ:', err)
            toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
        } finally {
            setIsCardSubmitting(false)
        }
    }

    return (
        <div className={'p-8 bg-background'}>
            <div className={'flex justify-between mb-8 items-center'}>
                <div>
                    <h1 className={'text-4xl font-bold text-foreground'}>Danh sách học sinh</h1>
                    <p className={'text-muted-foreground mt-2 mb-4'}>
                        Quản lý tất cả học sinh trong trường
                    </p>
                </div>
                <div className={'flex'}>
                    <Input
                        placeholder={'Lọc theo lớp...'}
                        value={classFilter}
                        onChange={(e) => {
                            setClassFilter(e.target.value)
                            setCurrentPage(1)
                        }}
                        className={'mr-4 w-40'}
                    />
                    <Select value={parentFilter} onValueChange={(val) => {
                        setParentFilter(val)
                        setCurrentPage(1)
                    }}>
                        <SelectTrigger className={'mr-4 w-48'}>
                            <SelectValue placeholder={'Phụ huynh'}/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_PARENTS}>Tất cả phụ huynh</SelectItem>
                            {parentOptions.map((parent) => (
                                <SelectItem key={parent.id} value={parent.id}>{parent.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(val: 'ACTIVE' | 'DELETED_ONLY') => {
                        setStatusFilter(val)
                        setCurrentPage(1)
                    }}>
                        <SelectTrigger className={'mr-4 w-40'}>
                            <SelectValue placeholder={'Trạng thái'}/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={'ACTIVE'}>Đang hoạt động</SelectItem>
                            <SelectItem value={'DELETED_ONLY'}>Đã xóa</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder={'Tìm kiếm...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={'mr-4'}
                    />
                    <Button className={'gap-2'} onClick={handleAddStudent}
                            disabled={statusFilter === 'DELETED_ONLY'}>
                        <Plus className={'w-4 h-4'}/>
                        Thêm học sinh
                    </Button>
                </div>
            </div>
            {isLoading || !students ? (
                <TableSkeleton columns={8}/>
            ) : (
                <>
                    <StudentsList
                        students={students}
                        onEdit={handleEditStudent}
                        onDelete={handleDeleteStudent}
                        onRestore={handleRestoreStudent}
                        onManageCard={handleManageCard}
                        onSortChange={handleSortChange}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        isDeleting={isDeleting}
                        isRestoring={isRestoring}
                        isDeletedMode={statusFilter === 'DELETED_ONLY'}
                    />
                    <div className={'mt-4 flex justify-end'}>
                        <CustomPagination
                            paginationData={students.metadata}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </>
            )}
            <FormDialog
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                title={selectedStudent?.id ? 'Chỉnh sửa học sinh' : 'Thêm học sinh mới'}
                description={selectedStudent?.id ? 'Chỉnh sửa thông tin học sinh.' : 'Nhập thông tin để thêm học sinh mới.'}
            >
                <StudentForm
                    parents={parentOptions}
                    initialData={selectedStudent}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseDialog}
                    isLoading={isSubmitting}
                />
            </FormDialog>
            <StudentCardDialog
                student={cardStudent}
                open={isCardDialogOpen}
                onOpenChange={(open) => {
                    setIsCardDialogOpen(open)
                    if (!open) setCardStudent(null)
                }}
                onAssign={handleAssignCard}
                onRemove={handleRemoveCard}
                isSubmitting={isCardSubmitting}
            />
        </div>
    )
}
