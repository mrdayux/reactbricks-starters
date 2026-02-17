import { fetchPage } from 'react-bricks/rsc'

import {
  getAbTestingCookie,
  removeAbTestingCookie,
  selectVariant,
  setAbTestingCookie,
} from '../lib/abTesting'

export const AB_TEST_VARIANT_HEADER = 'x-rb-ab-variant'

interface CreateAbTestingMiddlewareOpts {
  config: unknown
  NextResponse: any
}

export function createAbTestingMiddleware(
  opts: CreateAbTestingMiddlewareOpts
) {
  return async function middleware(request: any) {
    const { pathname } = request.nextUrl

    const locale = request.nextUrl.locale || 'en'

    let slug = ''
    if (pathname === '' || pathname === '/') {
      slug = '/'
    } else {
      slug = pathname.startsWith('/') ? pathname.slice(1) : pathname
    }

    const page = await fetchPage({
      slug,
      language: locale,
      config: opts.config as any,
    }).catch(() => null)

    if (!page || !page.variants || page.variants.length <= 1) {
      const response = opts.NextResponse.next()
      removeAbTestingCookie({
        slug,
        locale,
        cookieStore: response.cookies,
      })

      return response
    }

    const existingVariantName = getAbTestingCookie({
      slug,
      locale,
      cookieStore: request.cookies,
    })

    const existingVariant = page.variants.find(
      (v: any) => v.name === existingVariantName
    )

    if (existingVariant) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set(AB_TEST_VARIANT_HEADER, existingVariant.name)
      return opts.NextResponse.next({
        request: { headers: requestHeaders },
      })
    }

    const selectedVariant = selectVariant(page.variants)

    if (!selectedVariant) {
      return opts.NextResponse.next()
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set(AB_TEST_VARIANT_HEADER, selectedVariant.name)
    const response = opts.NextResponse.next({
      request: { headers: requestHeaders },
    })

    setAbTestingCookie({
      slug,
      locale,
      variantName: selectedVariant.name,
      cookieStore: response.cookies,
      variantUnpublishingDate:
        selectedVariant.scheduledForUnpublishingOn,
    })

    return response
  }
}
