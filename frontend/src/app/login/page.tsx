'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
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
        <div className="mx-auto mt-24 w-full max-w-md rounded-lg border border-border bg-card p-6">
            <h1 className="mb-2 text-2xl font-semibold">Đăng nhập quản trị</h1>
            <p className="mb-6 text-sm text-muted-foreground">Dùng tài khoản đã thiết lập mật khẩu qua liên kết mời.</p>

            <form onSubmit={onSubmit} className="space-y-4">
                <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </Field>

                <Field>
                    <FieldLabel>Mật khẩu</FieldLabel>
                    <Input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </Field>

                {error ? <FieldError errors={[{ message: error }]} /> : null}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
            </form>
        </div>
    )
}
