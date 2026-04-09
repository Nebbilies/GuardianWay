import { ReactNode } from 'react'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface FormDialogProps {
    isOpen: boolean
    onClose: () => void
    title: string
    description?: string
    children: ReactNode
}

export function FormDialog({
    isOpen,
    onClose,
    title,
    description,
    children,
}: FormDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] lg:w-auto max-w-[95vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>

                {children}
            </DialogContent>
        </Dialog>
    )
}
