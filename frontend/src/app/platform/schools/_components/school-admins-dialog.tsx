'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { School, SchoolAdmin, OnboardAdminResponse } from '@/types/types'
import { apiRequest } from '@/lib/api-client'
import { FormDialog } from '@/components/custom/form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'

const fetcher = <T,>(url: string) => apiRequest<T>(url)

interface SchoolAdminsDialogProps {
    school: School | null
    onClose: () => void
}

export default function SchoolAdminsDialog({ school, onClose }: SchoolAdminsDialogProps) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [inviteLink, setInviteLink] = useState<string | null>(null)

    const { data: admins, isLoading, mutate } = useSWR<SchoolAdmin[]>(
        school ? `/schools/${school.id}/admins` : null, fetcher,
    )

    const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!school) return
        setIsSubmitting(true)
        try {
            const res = await apiRequest<OnboardAdminResponse>(`/schools/${school.id}/admins`, {
                method: 'POST',
                body: JSON.stringify({ name, email }),
            })
            setInviteLink(res.inviteLink)
            setName('')
            setEmail('')
            await mutate()
            toast.success('Đã tạo quản trị viên và gửi lời mời!')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
        } finally {
            setIsSubmitting(false)
        }
    }

    const copyLink = async () => {
        if (!inviteLink) return
        await navigator.clipboard.writeText(inviteLink)
        toast.success('Đã sao chép liên kết mời')
    }

    return (
        <FormDialog
            isOpen={Boolean(school)}
            onClose={onClose}
            title={school ? `Quản trị viên — ${school.name}` : 'Quản trị viên'}
            description="Danh sách quản trị viên của trường và thêm quản trị viên mới."
        >
            <div className="space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Quản trị viên hiện tại</h3>
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</div>
                    ) : !admins || admins.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Chưa có quản trị viên nào.</p>
                    ) : (
                        <ul className="divide-y divide-border border border-border rounded-lg">
                            {admins.map((a) => (
                                <li key={a.id} className="flex items-center justify-between px-4 py-2 text-sm">
                                    <span className="text-foreground">{a.name} <span className="text-muted-foreground">({a.email})</span></span>
                                    <span className="text-xs text-muted-foreground">
                                        {a.passwordSetupRequired ? 'Chờ thiết lập mật khẩu' : 'Đã kích hoạt'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <form onSubmit={handleAdd} className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-foreground">Thêm quản trị viên</h3>
                    <Field>
                        <FieldLabel htmlFor="admin-name">Họ tên</FieldLabel>
                        <Input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting} />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="admin-email">Email</FieldLabel>
                        <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting} />
                    </Field>

                    {inviteLink && (
                        <div className="rounded-md bg-muted px-3 py-2 text-sm">
                            <p className="text-muted-foreground mb-1">Liên kết mời (cũng đã gửi qua email):</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 truncate text-xs text-foreground">{inviteLink}</code>
                                <Button type="button" size="sm" variant="outline" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang tạo...' : 'Thêm quản trị viên'}</Button>
                    </div>
                </form>
            </div>
        </FormDialog>
    )
}
