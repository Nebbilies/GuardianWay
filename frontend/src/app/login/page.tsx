'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {Field, FieldLabel} from '@/components/ui/field'
import {PasswordInput} from '@/components/custom/password-input'
import {AuthShell} from '@/components/custom/auth-shell'
import { apiRequest } from '@/lib/api-client'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            })

            router.push('/admin/users')
            router.refresh()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AuthShell
            title="Đăng nhập quản trị"
            description="Dùng tài khoản đã thiết lập mật khẩu qua liên kết mời."
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="ban@truong.edu.vn"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </Field>

                <Field>
                    <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                    <PasswordInput
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
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
                    {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
            </form>
        </AuthShell>
    )
}
