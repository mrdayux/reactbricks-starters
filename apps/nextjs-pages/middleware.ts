import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { fetchPage } from 'react-bricks/rsc'

import {
  getAbTestingCookie,
  removeAbTestingCookie,
  selectVariant,
  setAbTestingCookie,
} from '@/lib/abTesting'
import rbConfig, { abTestingEnabled } from '@/react-bricks/config-server'

export const AB_TEST_VARIANT_HEADER = 'x-rb-ab-variant'

export default async function middleware(request: NextRequest) {
  if (!abTestingEnabled) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // In pages router, Next.js handles i18n routing and provides the locale
  // via the NEXT_LOCALE cookie or URL prefix. We read it from nextUrl.
  const locale = request.nextUrl.locale || 'en'

  // GET slug from pathname (locale prefix is already stripped by Next.js in nextUrl.pathname)
  let slug = ''
  if (pathname === '' || pathname === '/') {
    slug = '/'
  } else {
    slug = pathname.startsWith('/') ? pathname.slice(1) : pathname
  }

  // Fetch page to check for variants
  const page = await fetchPage({
    slug,
    language: locale,
    config: rbConfig,
  }).catch(() => null)

  if (!page || !page.variants || page.variants.length <= 1) {
    const response = NextResponse.next()
    removeAbTestingCookie({
      slug,
      locale,
      cookieStore: response.cookies,
    })

    return response
  }

  // Check for existing variant cookie
  const existingVariantName = getAbTestingCookie({
    slug,
    locale,
    cookieStore: request.cookies,
  })

  const existingVariant = page.variants.find(
    (v) => v.name === existingVariantName
  )

  if (existingVariant) {
    // Pass the resolved variant to getServerSideProps via request header
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set(AB_TEST_VARIANT_HEADER, existingVariant.name)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Select a new variant (existing cookie was stale/missing)
  const selectedVariant = selectVariant(page.variants)

  if (!selectedVariant) {
    return NextResponse.next()
  }

  // Pass the resolved variant to getServerSideProps via request header
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set(AB_TEST_VARIANT_HEADER, selectedVariant.name)
  const response = NextResponse.next({ request: { headers: requestHeaders } })

  setAbTestingCookie({
    slug,
    locale,
    variantName: selectedVariant.name,
    cookieStore: response.cookies,
    variantUnpublishingDate: selectedVariant.scheduledForUnpublishingOn,
  })

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|admin|logo.svg|bricks-preview-images|preview).*)',
  ],
}
