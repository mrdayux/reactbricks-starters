import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const DEFAULT_AB_TESTING_COOKIE_TTL = 60 * 60 * 24 * 2 // 2 days

type ReadonlyCookies = NextRequest['cookies']
type ResponseCookies = NextResponse['cookies']

type Variant = {
  name: string
  weight: number
}

const COOKIE_NAME_PREFIX = 'rb_ab_test'

export function getAbTestingCookie({
  slug,
  locale,
  cookieStore,
}: {
  slug: string
  locale: string
  cookieStore: ReadonlyCookies
}) {
  const cookieName = `${COOKIE_NAME_PREFIX}_${slug}_${locale}`
  return cookieStore.get(cookieName)?.value
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
  cookieStore: ResponseCookies
  variantUnpublishingDate?: string
}) {
  const cookieName = `${COOKIE_NAME_PREFIX}_${slug}_${locale}`
  const maxAge = variantUnpublishingDate
    ? Math.max(
        Math.floor((Date.parse(variantUnpublishingDate) - Date.now()) / 1000),
        0
      )
    : DEFAULT_AB_TESTING_COOKIE_TTL

  cookieStore.set(cookieName, variantName, {
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
  cookieStore: ResponseCookies
}) {
  const cookieName = `${COOKIE_NAME_PREFIX}_${slug}_${locale}`
  cookieStore.delete(cookieName)
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
}) {
  const cookieName = `${COOKIE_NAME_PREFIX}_${slug}_${locale}`
  return cookies[cookieName]
}
