import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  try {
    // Define routes that require authentication
    const protectedRoutes = ['/dashboard']
    const protectedApiRoutes = ['/api/search', '/api/saved-searches', '/api/export']

    // Routes that should be public (SEO pages, marketing, webhooks, checkout)
    const publicRoutes = [
      '/', '/pricing', '/login', '/signup', '/demo',
      '/planning-applications',
      '/api/webhooks',
      '/api/stripe/checkout',
      '/api/stripe/portal'
    ]

    // Check if this is a protected route
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
    const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route))

    // Allow public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Check authentication for protected routes
    if (isProtectedRoute || isProtectedApi) {
      // Check for Supabase session cookies
      const accessToken = request.cookies.get('sb-access-token')?.value
      const refreshToken = request.cookies.get('sb-refresh-token')?.value

      // Also check Authorization header for API routes
      const authHeader = request.headers.get('authorization')
      const hasApiAuth = authHeader?.startsWith('Bearer ')

      if (!accessToken && !refreshToken && !hasApiAuth) {
        if (isProtectedApi) {
          // API routes return 401
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          )
        } else {
          // Web routes redirect to login
          return NextResponse.redirect(new URL('/login', request.url))
        }
      }
    }

    // Allow the request to continue
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)

    // Handle errors gracefully
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      )
    } else if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all routes except static files and images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}