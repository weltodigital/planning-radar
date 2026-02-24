import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Simple authentication check for dashboard routes only
    // Check if user has auth cookies
    const accessToken = request.cookies.get('sb-access-token')
    const refreshToken = request.cookies.get('sb-refresh-token')

    // If no auth cookies and trying to access dashboard, redirect to login
    if ((!accessToken || !refreshToken) && request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Allow the request to continue
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // If there's an error and accessing dashboard, redirect to login
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Only match dashboard routes for authentication
     * This reduces the scope and potential for errors
     */
    '/dashboard/:path*',
  ],
}