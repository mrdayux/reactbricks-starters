import { fetchPage } from 'react-bricks/astro/server'
import { reactBricksAstroStore } from 'react-bricks/astro'
import {
  getAbTestingCookie,
  removeAbTestingCookie,
  selectVariant,
  setAbTestingCookie,
} from '../lib/abTesting'

interface MiddlewareContext {
  url: URL
  cookies: {
    get(name: string): { value: string | undefined } | undefined
    set(name: string, value: string, options?: Record<string, unknown>): void
    delete(name: string): void
  }
  locals: any
}

type MiddlewareNext = () => Promise<Response> | Response

interface CreateAbTestingMiddlewareOpts {
  locales: readonly string[]
}

function getLocaleFromPath(
  pathname: string,
  locales: readonly string[]
): string | null {
  const parts = pathname.split('/').filter(Boolean)
  return locales.includes(parts[0]) ? parts[0] : null
}

function getSlugFromPath(pathname: string, locale: string): string {
  const localePrefix = `/${locale}`
  if (pathname === localePrefix || pathname === `${localePrefix}/`) {
    return '/'
  }
  if (pathname.startsWith(`${localePrefix}/`)) {
    return pathname.slice(localePrefix.length + 1)
  }
  return pathname || '/'
}

export function createAbTestingMiddleware(
  opts: CreateAbTestingMiddlewareOpts
) {
  return async (context: MiddlewareContext, next: MiddlewareNext) => {
    const { pathname } = context.url
    const lang = getLocaleFromPath(pathname, opts.locales)

    if (!lang) {
      return next()
    }

    const slug = getSlugFromPath(pathname, lang)
    const config = reactBricksAstroStore.getConfig()

    const page = await fetchPage({
      slug,
      language: lang,
      config,
    }).catch(() => null)

    if (!page || !page.variants || page.variants.length <= 1) {
      removeAbTestingCookie({
        slug,
        locale: lang,
        cookieStore: context.cookies,
      })
      return next()
    }

    const existingVariantName = getAbTestingCookie({
      slug,
      locale: lang,
      cookieStore: context.cookies,
    })

    const existingVariant = page.variants.find(
      (v) => v.name === existingVariantName
    )

    if (existingVariant) {
      context.locals.abTestVariant = existingVariant.name
      return next()
    }

    const selectedVariant = selectVariant(page.variants)

    if (!selectedVariant) {
      return next()
    }

    setAbTestingCookie({
      slug,
      locale: lang,
      variantName: selectedVariant.name,
      cookieStore: context.cookies,
      variantUnpublishingDate: selectedVariant.scheduledForUnpublishingOn,
    })

    context.locals.abTestVariant = selectedVariant.name

    return next()
  }
}
