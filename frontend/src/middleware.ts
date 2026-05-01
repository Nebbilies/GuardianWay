import { NextRequest, NextResponse } from 'next/server'

type AuthTokenPayload = {
    role?: string
}

function decodeJwtPayload(token: string): AuthTokenPayload | null {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts[1]) return null

    try {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
        return JSON.parse(atob(padded)) as AuthTokenPayload
    } catch {
        return null
    }
}

export function middleware(req: NextRequest) {
    if (req.nextUrl.pathname.startsWith('/admin')) {
        const accessToken = req.cookies.get('gw_access_token')?.value

        if (!accessToken) {
            const loginUrl = new URL('/login', req.url)
            return NextResponse.redirect(loginUrl)
        }

        const payload = decodeJwtPayload(accessToken)
        const allowedRoles = new Set(['ADMIN', 'STAFF'])

        if (!payload?.role || !allowedRoles.has(payload.role)) {
            const loginUrl = new URL('/login', req.url)
            return NextResponse.redirect(loginUrl)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*'],
}
