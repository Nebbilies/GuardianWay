import { NextRequest, NextResponse } from 'next/server'

type AuthTokenPayload = {
    role?: string
}

const PLATFORM_HOME = '/platform/schools'
const ADMIN_HOME = '/admin/users'

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
    const { pathname } = req.nextUrl
    const isAdmin = pathname.startsWith('/admin')
    const isPlatform = pathname.startsWith('/platform')
    if (!isAdmin && !isPlatform) return NextResponse.next()

    const accessToken = req.cookies.get('gw_access_token')?.value
    if (!accessToken) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    const role = decodeJwtPayload(accessToken)?.role
    if (!role) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    if (isPlatform && role !== 'SUPER_ADMIN') {
        const dest = role === 'ADMIN' ? ADMIN_HOME : '/login'
        return NextResponse.redirect(new URL(dest, req.url))
    }

    if (isAdmin && role !== 'ADMIN') {
        const dest = role === 'SUPER_ADMIN' ? PLATFORM_HOME : '/login'
        return NextResponse.redirect(new URL(dest, req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*', '/platform/:path*'],
}
