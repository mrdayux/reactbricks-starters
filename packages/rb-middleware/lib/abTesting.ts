export interface CookieReader {
  get(
    name: string
  ): { value: string | undefined } | string | undefined | null
}

export interface CookieWriter {
  set(name: string, value: string, options?: Record<string, unknown>): void
  delete(name: string): void
}

export const DEFAULT_AB_TESTING_COOKIE_TTL = 60 * 60 * 24 * 2 // 2 days

type Variant = {
  name: string
  weight: number
}

const COOKIE_NAME_PREFIX = 'rb_ab_test'

function getCookieName(slug: string, locale: string): string {
  return `${COOKIE_NAME_PREFIX}_${slug}_${locale}`
}

export function getAbTestingCookie({
  slug,
  locale,
  cookieStore,
}: {
  slug: string
  locale: string
  cookieStore: CookieReader
}): string | undefined {
  const result = cookieStore.get(getCookieName(slug, locale))
  if (result === null || result === undefined) return undefined
  if (typeof result === 'string') return result
  return result.value
}

export function setAbTestingCookie({
  slug,
  locale,
  variantName,
  cookieStore,
  variantUnpublishingDate,
}: {
  slug: string
  locale: string
  variantName: string
  cookieStore: CookieWriter
  variantUnpublishingDate?: string
}) {
  const maxAge = variantUnpublishingDate
    ? Math.max(
        Math.floor(
          (Date.parse(variantUnpublishingDate) - Date.now()) / 1000
        ),
        0
      )
    : DEFAULT_AB_TESTING_COOKIE_TTL

  cookieStore.set(getCookieName(slug, locale), variantName, {
    path: '/',
    httpOnly: true,
    maxAge,
    sameSite: 'lax',
    secure: true,
  })
}

export function removeAbTestingCookie({
  slug,
  locale,
  cookieStore,
}: {
  slug: string
  locale: string
  cookieStore: CookieWriter
}) {
  cookieStore.delete(getCookieName(slug, locale))
}

export function selectVariant<T extends Variant>(variants: T[]): T | null {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0)
  const rand = Math.random() * totalWeight

  let cumulative = 0
  for (const variant of variants) {
    cumulative += variant.weight
    if (rand < cumulative) return variant
  }

  return null
}

export function getAbTestingCookieFromReq({
  slug,
  locale,
  cookies,
}: {
  slug: string
  locale: string
  cookies: Partial<{ [key: string]: string }>
}): string | undefined {
  const cookieName = getCookieName(slug, locale)
  return cookies[cookieName]
}
