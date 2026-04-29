'use client'

import {Plus} from 'lucide-react'
import useSWR from 'swr'
import {Button} from '@/components/ui/button'
import {Bus, BusRouteWithStops, BusTripWithDetails, PaginatedResponse, UserWithProfiles} from '@/types/types'
import {FormDialog} from '@/components/custom/form-dialog'
import CustomPagination from '@/components/custom/custom-pagination'
import {useEffect, useState} from 'react'
import {toast} from 'sonner'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import BusTripsList from '@/app/admin/trips/_components/bus-trips-list'
import BusTripForm, {BusTripFormValues} from '@/app/admin/trips/_components/bus-trips-form'

import { apiRequest } from "@/lib/api-client";

const fetcher = <T,>(url: string) => apiRequest<T>(url);

export default function TripsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedBusTrip, setSelectedBusTrip] = useState<BusTripWithDetails | undefined>()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
    const [sortBy, setSortBy] = useState<string>('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 500)

        return () => clearTimeout(delayDebounce)
    }, [searchTerm])

    const params = new URLSearchParams()
    if (debouncedSearchTerm) {
        params.set('search', debouncedSearchTerm)
    }
    if (selectedStatus !== 'ALL') {
        params.set('status', selectedStatus)
    }
    if (sortBy) {
        params.set('sort', sortOrder === 'desc' ? `-${sortBy}` : sortBy)
    }
    if (currentPage > 1) {
        params.set('page', currentPage.toString())
    }

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

    const {
        data: busTrips,
        error,
        isLoading,
        mutate,
    } = useSWR<PaginatedResponse<BusTripWithDetails>>(`/bus-trips?${params.toString()}`, fetcher)

    const {data: busRoutes} = useSWR<PaginatedResponse<BusRouteWithStops>>(`/bus-routes?limit=1000`, fetcher)
    const {data: buses} = useSWR<PaginatedResponse<Bus>>(`/buses?limit=1000`, fetcher)
    const {data: drivers} = useSWR<PaginatedResponse<UserWithProfiles>>(`/users?role=DRIVER&limit=1000`, fetcher)

    if (error) {
        return <div className={'p-8 bg-white'}>Lỗi khi tải dữ liệu: {error.message}</div>
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setSelectedBusTrip(undefined)
    }

    const handleSubmit = async (data: BusTripFormValues & { id?: string }) => {
        setIsSubmitting(true)
        try {
            const url = data.id ? `/bus-trips/${data.id}` : `/bus-trips`
            const method = data.id ? 'PUT' : 'POST'
            await apiRequest(url, {
                method,
                body: JSON.stringify(data),
            })

            await mutate()
            toast.success(`Chuyến đi đã được ${data.id ? 'cập nhật' : 'tạo'} thành công!`)
            handleCloseDialog()
        } catch (error) {
            console.error('Có lỗi khi lưu chuyến đi:', error)
            toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddBusTrip = () => {
        setSelectedBusTrip(undefined)
        setIsDialogOpen(true)
    }

    const handleEditBusTrip = (busTrip: BusTripWithDetails) => {
        setSelectedBusTrip(busTrip)
        setIsDialogOpen(true)
    }

    const handleDeleteBusTrip = async (id: string) => {
        setIsDeleting(true)
        try {
            await apiRequest(`/bus-trips/${id}`, {
                method: 'DELETE',
            })

            await mutate()
            toast.success('Chuyến đi đã được xóa thành công!')
        } catch (error) {
            console.error('Có lỗi khi xóa chuyến đi:', error)
            toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className={'p-8 bg-white'}>
            <div className={'flex justify-between mb-8 items-center'}>
                <div>
                    <h1 className={'text-4xl font-bold text-foreground'}>Danh sách chuyến đi</h1>
                    <p className={'text-muted-foreground mt-2 mb-4'}>
                        Quản lý tất cả chuyến đi trong hệ thống
                    </p>
                </div>
                <div className={'flex'}>
                    <Select value={selectedStatus} onValueChange={(val) => {
                        setSelectedStatus(val)
                        setCurrentPage(1)
                    }}>
                        <SelectTrigger className={'mr-4 w-48'}>
                            <SelectValue placeholder={'Trạng thái'}/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={'ALL'}>Tất cả</SelectItem>
                            <SelectItem value={'SCHEDULED'}>Đã lên lịch</SelectItem>
                            <SelectItem value={'IN_PROGRESS'}>Đang chạy</SelectItem>
                            <SelectItem value={'COMPLETED'}>Hoàn thành</SelectItem>
                            <SelectItem value={'CANCELLED'}>Đã hủy</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder={'Tìm kiếm...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={'mr-4'}
                    />
                    <Button className={'gap-2'} onClick={handleAddBusTrip}>
                        <Plus className={'w-4 h-4'}/>
                        Thêm chuyến đi
                    </Button>
                </div>
            </div>
            {isLoading || !busTrips ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">Đang tải dữ liệu</p>
                </div>
            ) : (
                <>
                    <BusTripsList
                        busTrips={busTrips}
                        onEdit={handleEditBusTrip}
                        onDelete={handleDeleteBusTrip}
                        onSortChange={handleSortChange}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        isDeleting={isDeleting}
                    />
                    <div className={'mt-4 flex justify-end'}>
                        <CustomPagination
                            paginationData={busTrips.metadata}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </>
            )}
            <FormDialog
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                title={selectedBusTrip?.id ? 'Chỉnh sửa chuyến đi' : 'Tạo chuyến đi'}
                description={selectedBusTrip?.id ? 'Chỉnh sửa thông tin chuyến đi.' : 'Nhập thông tin để tạo chuyến đi mới.'}
            >
                {!busRoutes || !buses || !drivers ? (
                    <div className="bg-card border border-border rounded-lg p-8 text-center">
                        <p className="text-muted-foreground">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <BusTripForm
                        routes={busRoutes.data}
                        buses={buses.data}
                        drivers={drivers.data}
                        initialData={selectedBusTrip}
                        onSubmit={handleSubmit}
                        onCancel={handleCloseDialog}
                        isLoading={isSubmitting}
                    />
                )}
            </FormDialog>
        </div>
    )
}
