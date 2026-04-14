'use client'

import {Plus} from "lucide-react";
import useSWR from 'swr';
import {Button} from "@/components/ui/button";
import {Bus, PaginatedResponse} from "@/types/types";
import {FormDialog} from "@/components/custom/form-dialog";
import BusForm from "@/app/admin/buses/_components/buses-form";
import CustomPagination from "@/components/custom/custom-pagination";
import {useEffect, useState} from "react";
import {toast} from "sonner";
import {Input} from "@/components/ui/input";
import BusesList from "@/app/admin/buses/_components/buses-list";

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) {
        throw new Error('Failed to fetch: ' + res.statusText)
    }
    return res.json()
});

export default function StopsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedBus, setSelectedBus] = useState<Bus | undefined>();
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

    // fetch bus stops
    const {
        data: buses,
        error,
        isLoading,
        mutate,
    } = useSWR<PaginatedResponse<Bus>>(`${process.env.NEXT_PUBLIC_API_URL}/buses?${params.toString()}`, fetcher);

    if (error) {
        return <div className={'p-8 bg-white'}>Lỗi khi tải dữ liệu: {error.message}</div>
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedBus(undefined);
    }

    const handleSubmit = async (data: Partial<Bus>) => {
        setIsSubmitting(true);
        try {
            const url = data.id ? `${process.env.NEXT_PUBLIC_API_URL}/buses/${data.id}` : `${process.env.NEXT_PUBLIC_API_URL}/buses`;
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
            toast.success(`Xe đã được ${data.id ? 'cập nhật' : 'thêm'} thành công!`);
            handleCloseDialog();
        } catch (error) {
            console.error('Có lỗi khi lưu xe buýt:', error);
            toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAddBus = () => {
        setSelectedBus(undefined);
        setIsDialogOpen(true);
    }

    const handleEditBus = (bus: Bus) => {
        setSelectedBus(bus);
        setIsDialogOpen(true);
    }

    const handleDeleteBus = async (id: string)=> {
        setIsDeleting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buses/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: res.statusText }));
                throw new Error(errorData.message || 'Đã xảy ra lỗi');
            }

            await mutate();
            toast.success('Xe đã được xóa thành công!');
        } catch (error) {
            console.error('Có lỗi khi xóa xe buýt:', error);
            toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className={'p-8 bg-white'}>
            <div className={'flex justify-between mb-8 items-center'}>
                <div>
                    <h1 className={'text-4xl font-bold text-foreground'}>Danh sách xe buýt</h1>
                    <p className={'text-muted-foreground mt-2 mb-4'}>
                        Quản lý tất cả xe buýt trong hệ thống
                    </p>
                </div>
                <div className={'flex'}>
                    <Input
                        placeholder={'Tìm kiếm...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={'mr-4'}
                    />
                    <Button className={'gap-2'} onClick={handleAddBus}>
                        <Plus className={'w-4 h-4'}/>
                        Thêm xe
                    </Button>
                </div>
            </div>
            {isLoading || !buses ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">Đang tải dữ liệu</p>
                </div>
            ) : (
                <>
                    <BusesList
                        buses={buses}
                        onEdit={handleEditBus}
                        onDelete={handleDeleteBus}
                        onSortChange={handleSortChange}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        isDeleting={isDeleting}
                    />
                    <div className={'mt-4 flex justify-end'}>
                        <CustomPagination
                            paginationData={buses.metadata}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </>
            )}
            <FormDialog
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                title={selectedBus?.id ? 'Chỉnh sửa xe' : 'Thêm xe mới'}
                description={selectedBus?.id ? 'Chỉnh sửa thông tin xe buýt' : 'Nhập thông tin để thêm xe mới.'}
            >
                <BusForm
                    initialData={selectedBus}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseDialog}
                    isLoading={isSubmitting}
                />
            </FormDialog>
        </div>
    )
}