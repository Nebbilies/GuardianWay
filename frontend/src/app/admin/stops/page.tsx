'use client'

import {Plus} from "lucide-react";
import useSWR from 'swr';
import {Button} from "@/components/ui/button";
import {BusStop, PaginatedResponse} from "@/types/types";
import BusStopsList from "@/app/admin/stops/_components/bus-stops-list";
import {FormDialog} from "@/components/custom/form-dialog";
import BusStopForm from "@/app/admin/stops/_components/bus-stops-form";
import {useEffect, useState} from "react";
import {toast} from "sonner";
import {Input} from "@/components/ui/input";
import * as sea from "node:sea";

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) {
        throw new Error('Failed to fetch: ' + res.statusText)
    }
    return res.json()
});

export default function StopsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedBusStop, setSelectedBusStop] = useState<BusStop | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Debounce search term
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

    // sort change from children list
    const handleSortChange = (key: string) => {
        if (sortBy === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortOrder('asc');
        }
    }

    // fetch bus stops
    const {
        data: busStops,
        error,
        isLoading,
        mutate,
    } = useSWR<PaginatedResponse<BusStop>>(`${process.env.NEXT_PUBLIC_API_URL}/bus-stops?${params.toString()}`, fetcher);

    if (error) {
        return <div className={'p-8 bg-white'}>Lỗi khi tải dữ liệu: {error.message}</div>
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedBusStop(undefined);
    }

    const handleSubmit = async (data: Partial<BusStop>) => {
        setIsSubmitting(true);
        try {
            const url = data.id ? `${process.env.NEXT_PUBLIC_API_URL}/bus-stops/${data.id}` : `${process.env.NEXT_PUBLIC_API_URL}/bus-stops`;
            const method = data.id ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                throw new Error('Đã xảy ra lỗi: ' + res.statusText);
            }

            await mutate();
            toast.success(`Trạm dừng đã được ${data.id ? 'cập nhật' : 'tạo'} thành công!`);
            handleCloseDialog();
        } catch (error) {
            console.error('Có lỗi khi lưu điểm dừng:', error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAddBusStop = () => {
        setSelectedBusStop(undefined);
        setIsDialogOpen(true);
    }

    const handleEditBusStop = (busStop: BusStop) => {
        setSelectedBusStop(busStop);
        setIsDialogOpen(true);
    }

    const handleDeleteBusStop = async (id: string)=> {
        setIsDeleting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bus-stops/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Đã xảy ra lỗi: ' + res.statusText);
            }

            await mutate();
            toast.success('Trạm dừng đã được xóa thành công!');
        } catch (error) {
            console.error('Có lỗi khi xóa điểm dừng:', error);
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <div className={'p-8 bg-white'}>
            <div className={'flex justify-between mb-8 items-center'}>
                <div>
                    <h1 className={'text-4xl font-bold text-foreground'}>Danh sách điểm dừng</h1>
                    <p className={'text-muted-foreground mt-2 mb-4'}>
                        Quản lý tất cả các điểm dừng trong hệ thống
                    </p>
                </div>
                <div className={'flex'}>
                    <Input
                        placeholder={'Tìm kiếm...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={'mr-4'}
                    />
                    <Button className={'gap-2'} onClick={handleAddBusStop}>
                        <Plus className={'w-4 h-4'}/>
                        Thêm điểm dừng
                    </Button>
                </div>
            </div>
            {isLoading || !busStops ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">Đang tải dữ liệu</p>
                </div>
            ) : (
                        <BusStopsList
                            busStops={busStops}
                            onEdit={handleEditBusStop}
                            onDelete={handleDeleteBusStop}
                            onSortChange={handleSortChange}
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            isDeleting={isDeleting}
                        />
                )}
            <FormDialog
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                title={selectedBusStop?.id ? 'Chỉnh sửa điểm dừng' : 'Tạo điểm dừng'}
                description={selectedBusStop?.id ? 'Chỉnh sửa thông tin điểm dừng.' : 'Nhập thông tin để tạo điểm dừng mới.'}
            >
                <BusStopForm
                    initialData={selectedBusStop}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseDialog}
                    isLoading={isSubmitting}
                />
            </FormDialog>
        </div>
    )
}