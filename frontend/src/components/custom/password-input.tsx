'use client'

import * as React from 'react'
import {useState} from 'react'
import {Eye, EyeOff} from 'lucide-react'
import {Input} from '@/components/ui/input'
import {cn} from '@/lib/utils'

// Standard auth affordance: a password field with an inline show/hide toggle.
// Forwards every native input prop through to the underlying Input.
export function PasswordInput({className, disabled, ...props}: React.ComponentProps<typeof Input>) {
    const [visible, setVisible] = useState(false)

    return (
        <div className="relative">
            <Input
                {...props}
                type={visible ? 'text' : 'password'}
                disabled={disabled}
                className={cn('pr-10', className)}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                disabled={disabled}
                tabIndex={-1}
                aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
                {visible ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
            </button>
        </div>
    )
}
