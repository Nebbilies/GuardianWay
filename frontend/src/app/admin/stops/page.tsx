'use client'

import {Plus} from "lucide-react";
import useSWR from 'swr';
import {Button} from "@/components/ui/button";
import {BusStop} from "@/types/types";
import BusStopsList from "@/app/admin/stops/_components/bus-stops-list";
import {FormDialog} from "@/components/custom/form-dialog";
import BusStopForm from "@/app/admin/stops/_components/bus-stops-form";
import {useState} from "react";

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
                throw new Error('Failed to save bus stop: ' + res.statusText);
            }

            await mutate();
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

    const { data: busStops = [], error, isLoading, mutate } = useSWR<BusStop[]>(`${process.env.NEXT_PUBLIC_API_URL}/bus-stops`, fetcher)

    if (error) {
        return <div className={'p-8 bg-white'}>Lỗi khi tải dữ liệu: {error.message}</div>
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
                <Button className={'gap-2'} onClick={handleAddBusStop}>
                    <Plus className={'w-4 h-4'}/>
                    Thêm điểm dừng
                </Button>
            </div>
            {isLoading ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">Đang tải dữ liệu</p>
                </div>
            ) : (
                        <BusStopsList
                            busStops={busStops}
                            onEdit={handleEditBusStop}
                            onDelete={async (id) => console.log('Delete', id)}
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