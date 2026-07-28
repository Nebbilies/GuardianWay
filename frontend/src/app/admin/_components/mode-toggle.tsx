'use client'

import {useTheme} from 'next-themes'
import {Moon, Sun} from 'lucide-react'
import {Button} from '@/components/ui/button'

export default function ModeToggle() {
    const {resolvedTheme, setTheme} = useTheme()

    // Icons are CSS-driven off the `.dark` class so there's no hydration-time
    // state to reconcile: Moon shows in light (click → dark), Sun in dark.
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Chuyển chế độ sáng/tối"
        >
            <Moon className="h-5 w-5 dark:hidden"/>
            <Sun className="hidden h-5 w-5 dark:block"/>
        </Button>
    )
}
