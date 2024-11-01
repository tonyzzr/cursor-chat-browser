import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only check the root path
  if (request.nextUrl.pathname === '/') {
    // Get workspacePath from localStorage on client side
    const workspacePath = request.cookies.get('workspacePath')?.value
    
    if (!workspacePath) {
      // Redirect to config if no workspace path is set
      return NextResponse.redirect(new URL('/config', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/'
} 