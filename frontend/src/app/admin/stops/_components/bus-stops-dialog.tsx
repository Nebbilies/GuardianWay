'use client'
import { BusStop } from '@/types/types'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import BusStopForm from "@/app/admin/stops/_components/bus-stops-form";

interface BusStopDialogProps {
    isOpen: boolean
    onClose: () => void
    initialData?: BusStop
    onSubmit: (data: Partial<BusStop>) => Promise<void>
    isLoading?: boolean
}

export function BusStopDialog({
                                  isOpen,
                                  onClose,
                                  initialData,
                                  onSubmit,
                                  isLoading,
                              }: BusStopDialogProps) {
    const isEditing = !!initialData?.id

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Chỉnh sửa điểm dừng' : 'Tạo điểm dừng'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? 'Chỉnh sửa thông tin điểm dừng.'
                            : 'Nhập thông tin để tạo điểm dừng mới.'}
                    </DialogDescription>
                </DialogHeader>

                <BusStopForm
                    initialData={initialData}
                    onSubmit={onSubmit}
                    onCancel={onClose}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    )
}
