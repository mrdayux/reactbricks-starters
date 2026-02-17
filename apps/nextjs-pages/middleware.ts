import { NextResponse } from 'next/server'
import { createAbTestingMiddleware } from '@reactbricks/rb-middleware/nextjs-pages'

import rbConfig, { abTestingEnabled } from '@/react-bricks/config-server'

const abTestingMiddleware = createAbTestingMiddleware({
  config: rbConfig,
  NextResponse,
})

export default async function middleware(request: any) {
  if (!abTestingEnabled) {
    return NextResponse.next()
  }

  return abTestingMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|admin|logo.svg|bricks-preview-images|preview).*)',
  ],
}
