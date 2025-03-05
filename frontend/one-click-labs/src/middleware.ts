import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get token from cookies or localStorage (through cookie for SSR compatibility)
  const token = request.cookies.get('token')?.value
  
  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/register']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))
  
  // If trying to access protected route without auth, redirect to login
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // If already authenticated and trying to access login/register, redirect to dashboard
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
