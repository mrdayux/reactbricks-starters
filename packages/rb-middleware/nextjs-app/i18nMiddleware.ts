import type { CustomMiddleware } from './chain'

interface CreateI18nMiddlewareOpts {
  i18n: { locales: readonly string[]; defaultLocale: string }
  NextResponse: {
    redirect(url: URL): any
    rewrite(url: URL): any
  }
}

export function createI18nMiddleware(opts: CreateI18nMiddlewareOpts) {
  return function withI18nMiddleware(middleware: CustomMiddleware) {
    return async (request: any, event: any, response: any) => {
      const pathname = request.nextUrl.pathname

      if (
        pathname.startsWith(`/${opts.i18n.defaultLocale}/`) ||
        pathname === `/${opts.i18n.defaultLocale}`
      ) {
        return opts.NextResponse.redirect(
          new URL(
            pathname.replace(
              `/${opts.i18n.defaultLocale}`,
              pathname === `/${opts.i18n.defaultLocale}` ? '/' : ''
            ),
            request.url
          )
        )
      }

      const pathnameIsMissingLocale = opts.i18n.locales.every(
        (locale: string) =>
          !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
      )

      if (pathnameIsMissingLocale) {
        return opts.NextResponse.rewrite(
          new URL(
            `/${opts.i18n.defaultLocale}${pathname}`,
            request.url
          )
        )
      }

      return middleware(request, event, response)
    }
  }
}
