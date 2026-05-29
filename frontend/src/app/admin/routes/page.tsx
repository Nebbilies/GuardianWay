'use client'

import {Plus} from "lucide-react";
import useSWR from 'swr';
import {Button} from "@/components/ui/button";
import {PaginatedResponse, BusStop, BusRouteWithStops} from "@/types/types";
import {FormDialog} from "@/components/custom/form-dialog";
import CustomPagination from "@/components/custom/custom-pagination";
import {useEffect, useState} from "react";
import {toast} from "sonner";
import {Input} from "@/components/ui/input";
import BusRoutesList from "@/app/admin/routes/_components/bus-routes-list";
import BusRouteForm, { BusRouteFormValues } from "@/app/admin/routes/_components/bus-routes-form";

import { apiRequest } from "@/lib/api-client";

const fetcher = <T,>(url: string) => apiRequest<T>(url);

export default function RoutesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedBusRoute, setSelectedBusRoute] = useState<BusRouteWithStops | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);

    // debounce search term
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    // Build URL params
    const params = new URLSearchParams();
    if (debouncedSearchTerm) {
        params.set('search', debouncedSearchTerm);
    }
    if (sortBy) {
        params.set('sort', sortOrder === 'desc' ? `-${sortBy}` : sortBy);
    }
    if (currentPage > 1) {
        params.set('page', currentPage.toString());
    }

    // sort change from children list
    const handleSortChange = (key: string) => {
        if (sortBy === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortOrder('asc');
        }
        setCurrentPage(1);
    }

    // page change from pagination
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    }

    // fetch
    const {
        data: busRoutes,
        error,
        isLoading,
        mutate,
    } = useSWR<PaginatedResponse<BusRouteWithStops>>(`/bus-routes?${params.toString()}`, fetcher);

    // TODO: fails when there are more than 1000 bus stops, need to implement pagination
    // Must be called before any early return so hook order stays stable (rules-of-hooks).
    const { data: busStops } = useSWR<PaginatedResponse<BusStop>>(`/bus-stops?limit=1000`, fetcher);

    if (error) {
        return <div className={'p-8 bg-white'}>Lỗi khi tải dữ liệu: {error.message}</div>
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedBusRoute(undefined);
    }

    const handleSubmit = async (data: BusRouteFormValues & { id?: string }) => {
        setIsSubmitting(true);
        try {
            const url = data.id ? `/bus-routes/${data.id}` : `/bus-routes`;
            const method = data.id ? 'PUT' : 'POST';
            await apiRequest(url, {
                method,
                body: JSON.stringify(data),
            });

            await mutate();
            toast.success(`Tuyến đường đã được ${data.id ? 'cập nhật' : 'tạo'} thành công!`);
            handleCloseDialog();
        } catch (error) {
            console.error('Có lỗi khi lưu tuyến đường:', error);
            toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAddBusRoute = () => {
        setSelectedBusRoute(undefined);
        setIsDialogOpen(true);
    }

    const handleEditBusRoute = (busRoute: BusRouteWithStops) => {
        setSelectedBusRoute(busRoute);
        setIsDialogOpen(true);
    }

    const handleDeleteBusRoute = async (id: string)=> {
        setIsDeleting(true);
        try {
            await apiRequest(`/bus-routes/${id}`, {
                method: 'DELETE',
            });

            await mutate();
            toast.success('Tuyến đường đã được xóa thành công!');
        } catch (error) {
            console.error('Có lỗi khi xóa tuyến đường:', error);
            toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className={'p-8 bg-white'}>
            <div className={'flex justify-between mb-8 items-center'}>
                <div>
                    <h1 className={'text-4xl font-bold text-foreground'}>Danh sách tuyến đường</h1>
                    <p className={'text-muted-foreground mt-2 mb-4'}>
                        Quản lý tất cả các tuyến đường trong hệ thống
                    </p>
                </div>
                <div className={'flex'}>
                    <Input
                        placeholder={'Tìm kiếm...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={'mr-4'}
                    />
                    <Button className={'gap-2'} onClick={handleAddBusRoute}>
                        <Plus className={'w-4 h-4'}/>
                        Thêm tuyến đường
                    </Button>
                </div>
            </div>
            {isLoading || !busRoutes ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">Đang tải dữ liệu</p>
                </div>
            ) : (
                <>
                    <BusRoutesList
                        busRoutes={busRoutes}
                        onEdit={handleEditBusRoute}
                        onDelete={handleDeleteBusRoute}
                        onSortChange={handleSortChange}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        isDeleting={isDeleting}
                    />
                    <div className={'mt-4 flex justify-end'}>
                        <CustomPagination
                            paginationData={busRoutes.metadata}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </>
            )}
            <FormDialog
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                title={selectedBusRoute?.id ? 'Chỉnh sửa tuyến đường' : 'Tạo tuyến đường'}
                description={selectedBusRoute?.id ? 'Chỉnh sửa thông tin tuyến đường.' : 'Nhập thông tin để tạo tuyến đường mới.'}
            >
                {!busStops ? (
                    <div className="bg-card border border-border rounded-lg p-8 text-center">
                        <p className="text-muted-foreground">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <BusRouteForm
                        busStops={busStops.data}
                        initialData={selectedBusRoute}
                        onSubmit={handleSubmit}
                        onCancel={handleCloseDialog}
                        isLoading={isSubmitting}
                    />
                )}
            </FormDialog>
        </div>
    )
}