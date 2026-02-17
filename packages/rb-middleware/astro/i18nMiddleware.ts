interface MiddlewareContext {
  url: URL
  locals: any
  rewrite(path: string): Response | Promise<Response>
  redirect(path: string): Response | Promise<Response>
}

type MiddlewareNext = () => Promise<Response> | Response

interface CreateI18nMiddlewareOpts {
  locales: readonly string[]
  defaultLocale: string
  skipPaths?: readonly string[]
}

const DEFAULT_SKIP_PATHS = [
  '/admin',
  '/preview',
  '/api',
  '/favicon.ico',
  '/logo.svg',
]

function shouldSkip(pathname: string, skipPaths: readonly string[]): boolean {
  return skipPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}

function getLocaleFromPath(
  pathname: string,
  locales: readonly string[]
): string | null {
  const parts = pathname.split('/').filter(Boolean)
  return locales.includes(parts[0]) ? parts[0] : null
}

export function createI18nMiddleware(opts: CreateI18nMiddlewareOpts) {
  const skipPaths = opts.skipPaths ?? DEFAULT_SKIP_PATHS

  return (context: MiddlewareContext, next: MiddlewareNext) => {
    const { pathname } = context.url

    if (shouldSkip(pathname, skipPaths)) {
      return next()
    }

    const lang = getLocaleFromPath(pathname, opts.locales)

    if (!lang) {
      context.locals.isRewrite = true
      return context.rewrite(`/${opts.defaultLocale}${pathname}`)
    }

    if (!context.locals.isRewrite && lang === opts.defaultLocale) {
      return context.redirect(
        pathname.replace(`/${opts.defaultLocale}`, '') || '/'
      )
    }

    return next()
  }
}
