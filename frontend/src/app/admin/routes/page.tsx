'use client'

import {Plus} from "lucide-react";
import useSWR from 'swr';
import {Button} from "@/components/ui/button";
import {BusRoute, PaginatedResponse} from "@/types/types";
import {FormDialog} from "@/components/custom/form-dialog";
import CustomPagination from "@/components/custom/custom-pagination";
import {useEffect, useState} from "react";
import {toast} from "sonner";
import {Input} from "@/components/ui/input";
import BusRoutesList from "@/app/admin/routes/_components/bus-routes-list";
import BusRouteForm from "@/app/admin/routes/_components/bus-routes-form";

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) {
        throw new Error('Failed to fetch: ' + res.statusText)
    }
    return res.json()
});

export default function RoutesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedBusRoute, setSelectedBusRoute] = useState<BusRoute | undefined>();
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
    } = useSWR<PaginatedResponse<BusRoute>>(`${process.env.NEXT_PUBLIC_API_URL}/bus-routes?${params.toString()}`, fetcher);

    if (error) {
        return <div className={'p-8 bg-white'}>Lỗi khi tải dữ liệu: {error.message}</div>
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedBusRoute(undefined);
    }

    const handleSubmit = async (data: Partial<BusRoute>) => {
        setIsSubmitting(true);
        try {
            const url = data.id ? `${process.env.NEXT_PUBLIC_API_URL}/bus-routes/${data.id}` : `${process.env.NEXT_PUBLIC_API_URL}/bus-routes`;
            const method = data.id ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: res.statusText }));
                throw new Error(errorData.message || 'Đã xảy ra lỗi');
            }

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

    const handleEditBusRoute = (busRoute: BusRoute) => {
        setSelectedBusRoute(busRoute);
        setIsDialogOpen(true);
    }

    const handleDeleteBusRoute = async (id: string)=> {
        setIsDeleting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bus-routes/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: res.statusText }));
                throw new Error(errorData.message || 'Đã xảy ra lỗi');
            }

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
                <BusRouteForm
                    initialData={selectedBusRoute}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseDialog}
                    isLoading={isSubmitting}
                />
            </FormDialog>
        </div>
    )
}