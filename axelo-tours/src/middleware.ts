import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Partner Portal Protection ─────────────────────────────────────────────
  // Allow the login page and public partner landing page to pass through freely
  if (
    (pathname === '/partner' || pathname.startsWith('/partner/')) && 
    !pathname.startsWith('/partner/login')
  ) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll() { /* read-only in middleware context */ },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/partner/login', request.url))
    }
  }

  // ── API v1: Let Next.js route handlers deal with auth (x-api-key) ─────────
  if (pathname.startsWith('/api/v1')) {
    return NextResponse.next()
  }

  // ── Default: refresh Supabase session cookies ─────────────────────────────
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
