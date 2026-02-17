import { fetchPage } from 'react-bricks/rsc'

import {
  getAbTestingCookie,
  removeAbTestingCookie,
  selectVariant,
  setAbTestingCookie,
} from '../lib/abTesting'
import type { CustomMiddleware } from './chain'

interface CreateAbTestingMiddlewareOpts {
  i18n: { locales: readonly string[]; defaultLocale: string }
  config: unknown
}

export function createAbTestingMiddleware(
  opts: CreateAbTestingMiddlewareOpts
) {
  return function withAbTestingMiddleware(middleware: CustomMiddleware) {
    return async (request: any, event: any, response: any) => {
      const resolvedResponse = response ?? { cookies: request.cookies }

      const { pathname } = request.nextUrl

      let currentLocale = opts.i18n.locales.find(
        (locale: string) =>
          pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
      )
      const locale = currentLocale || opts.i18n.defaultLocale

      let slug = ''
      if (currentLocale && pathname.startsWith(`/${currentLocale}/`)) {
        const localePrefix = `/${currentLocale}/`
        slug = pathname.slice(localePrefix.length - 1)
      } else if (
        (currentLocale && pathname === `/${currentLocale}`) ||
        pathname === '' ||
        pathname === '/'
      ) {
        slug = '/'
      } else {
        slug = pathname.slice(1)
      }

      const page = await fetchPage({
        slug,
        language: locale,
        config: opts.config as any,
        fetchOptions: { next: { revalidate: 3 } },
      }).catch(() => {
        return null
      })

      if (!page || !page.variants || page.variants.length === 1) {
        const finalResponse = await middleware(
          request,
          event,
          resolvedResponse
        )
        const responseWithCookie = finalResponse ?? resolvedResponse

        removeAbTestingCookie({
          slug,
          locale,
          cookieStore: responseWithCookie.cookies,
        })

        return responseWithCookie
      }

      const existingVariantName = getAbTestingCookie({
        slug,
        locale,
        cookieStore: request.cookies,
      })

      let selectedVariant =
        page.variants.find((v) => v.name === existingVariantName) ?? null

      if (selectedVariant) {
        return middleware(request, event, resolvedResponse)
      }

      selectedVariant = selectVariant(page.variants)
      if (!selectedVariant) {
        return middleware(request, event, resolvedResponse)
      }

      const finalResponse = await middleware(
        request,
        event,
        resolvedResponse
      )
      const responseWithCookie = finalResponse ?? resolvedResponse

      setAbTestingCookie({
        slug,
        locale,
        variantName: selectedVariant.name,
        cookieStore: responseWithCookie.cookies,
        variantUnpublishingDate:
          selectedVariant.scheduledForUnpublishingOn,
      })

      return responseWithCookie
    }
  }
}
