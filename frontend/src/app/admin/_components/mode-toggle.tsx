'use client'

import {useEffect, useState} from 'react'
import {useTheme} from 'next-themes'
import {Moon, Sun} from 'lucide-react'
import {Button} from '@/components/ui/button'

export default function ModeToggle() {
    const {resolvedTheme, setTheme} = useTheme()
    const [mounted, setMounted] = useState(false)

    // Theme is unknown during SSR; render a stable placeholder until mounted so
    // the icon doesn't mismatch on hydration.
    useEffect(() => setMounted(true), [])

    const isDark = resolvedTheme === 'dark'

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label="Chuyển chế độ sáng/tối"
        >
            {mounted && isDark ? <Sun className="h-5 w-5"/> : <Moon className="h-5 w-5"/>}
        </Button>
    )
}
