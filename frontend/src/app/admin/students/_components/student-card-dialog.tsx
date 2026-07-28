'use client'

import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Field, FieldDescription, FieldLabel} from '@/components/ui/field'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {StudentWithParent} from '@/types/types'

interface StudentCardDialogProps {
    student: StudentWithParent | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onAssign: (cardId: string) => Promise<void>
    onRemove: () => Promise<void>
    isSubmitting?: boolean
}

export default function StudentCardDialog({
                                              student,
                                              open,
                                              onOpenChange,
                                              onAssign,
                                              onRemove,
                                              isSubmitting = false,
                                          }: StudentCardDialogProps) {
    const [cardId, setCardId] = useState('')

    // Reset the input whenever a different student's dialog opens.
    useEffect(() => {
        if (open) setCardId('')
    }, [open, student?.id])

    const hasCard = !!student?.cardTokenHash

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Quản lý thẻ</DialogTitle>
                    <DialogDescription>
                        {student ? `Học sinh: ${student.fullName} (${student.studentId})` : ''}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                        Trạng thái thẻ:{' '}
                        <span className={hasCard ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                            {hasCard ? 'Đã gán thẻ' : 'Chưa gán thẻ'}
                        </span>
                    </div>

                    <Field>
                        <FieldLabel htmlFor="cardId">Mã thẻ vật lý</FieldLabel>
                        <Input
                            id="cardId"
                            value={cardId}
                            onChange={(e) => setCardId(e.target.value)}
                            placeholder="Quét hoặc nhập mã thẻ"
                            disabled={isSubmitting}
                        />
                        <FieldDescription>
                            Chỉ mã băm của thẻ được lưu; mã gốc không bao giờ được lưu trữ.
                        </FieldDescription>
                    </Field>

                    <div className="flex justify-end gap-3 pt-2">
                        {hasCard && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onRemove}
                                disabled={isSubmitting}
                            >
                                Gỡ thẻ
                            </Button>
                        )}
                        <Button
                            type="button"
                            onClick={() => onAssign(cardId)}
                            disabled={isSubmitting || cardId.trim() === ''}
                        >
                            {isSubmitting ? 'Đang lưu...' : hasCard ? 'Cập nhật thẻ' : 'Gán thẻ'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
