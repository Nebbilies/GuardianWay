import {ReactNode} from 'react'
import {Bus} from 'lucide-react'

interface AuthShellProps {
    title: string
    description: string
    children: ReactNode
}

// Full-height, centered auth surface with the GuardianWay brand lockup above
// the card. Shared by the login and password-setup screens.
export function AuthShell({title, description, children}: AuthShellProps) {
    return (
        <div className="grid min-h-screen place-items-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                        <Bus className="h-8 w-8 text-primary-foreground"/>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">GuardianWay</span>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
                    <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
                    <p className="mt-1.5 mb-6 text-sm text-muted-foreground">{description}</p>
                    {children}
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Hệ thống theo dõi xe buýt trường học
                </p>
            </div>
        </div>
    )
}
