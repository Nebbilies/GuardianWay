'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { apiRequest } from '@/lib/api-client'

function SetupPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token') || ''

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError('')

        if (!token) {
            setError('Liên kết không hợp lệ')
            return
        }

        if (password.length < 8) {
            setError('Mật khẩu phải có ít nhất 8 ký tự')
            return
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp')
            return
        }

        setIsSubmitting(true)

        try {
            await apiRequest('/auth/setup-password', {
                method: 'POST',
                body: JSON.stringify({ token, password }),
            })

            router.push('/login')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Thiết lập mật khẩu thất bại')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="mx-auto mt-24 w-full max-w-md rounded-lg border border-border bg-card p-6">
            <h1 className="mb-2 text-2xl font-semibold">Thiết lập mật khẩu</h1>
            <p className="mb-6 text-sm text-muted-foreground">Nhập mật khẩu mới để hoàn tất kích hoạt tài khoản.</p>

            <form onSubmit={onSubmit} className="space-y-4">
                <Field>
                    <FieldLabel>Mật khẩu mới</FieldLabel>
                    <Input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </Field>

                <Field>
                    <FieldLabel>Xác nhận mật khẩu</FieldLabel>
                    <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </Field>

                {error ? <FieldError errors={[{ message: error }]} /> : null}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang lưu...' : 'Hoàn tất'}
                </Button>
            </form>
        </div>
    )
}

export default function SetupPasswordPage() {
    return (
        <Suspense fallback={<div className="mx-auto mt-24 w-full max-w-md text-center">Đang tải...</div>}>
            <SetupPasswordForm />
        </Suspense>
    )
}
