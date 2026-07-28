'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {Field, FieldLabel, FieldDescription} from '@/components/ui/field'
import {PasswordInput} from '@/components/custom/password-input'
import {AuthShell} from '@/components/custom/auth-shell'
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
        <AuthShell
            title="Thiết lập mật khẩu"
            description="Nhập mật khẩu mới để hoàn tất kích hoạt tài khoản."
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <Field>
                    <FieldLabel htmlFor="password">Mật khẩu mới</FieldLabel>
                    <PasswordInput
                        id="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                    <FieldDescription>Ít nhất 8 ký tự.</FieldDescription>
                </Field>

                <Field>
                    <FieldLabel htmlFor="confirmPassword">Xác nhận mật khẩu</FieldLabel>
                    <PasswordInput
                        id="confirmPassword"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </Field>

                {error ? (
                    <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {error}
                    </div>
                ) : null}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang lưu...' : 'Hoàn tất'}
                </Button>
            </form>
        </AuthShell>
    )
}

export default function SetupPasswordPage() {
    return (
        <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Đang
            tải...</div>}>
            <SetupPasswordForm />
        </Suspense>
    )
}
