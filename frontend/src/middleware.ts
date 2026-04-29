import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
    if (req.nextUrl.pathname.startsWith('/admin')) {
        const accessToken = req.cookies.get('gw_access_token')?.value

        if (!accessToken) {
            const loginUrl = new URL('/login', req.url)
            return NextResponse.redirect(loginUrl)
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*'],
}
