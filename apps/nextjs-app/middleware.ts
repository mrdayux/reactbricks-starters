import { NextResponse } from 'next/server'
import {
  chain,
  createAbTestingMiddleware,
  createI18nMiddleware,
} from '@reactbricks/rb-middleware/nextjs-app'

import { i18n } from '@/i18n-config'
import rbConfig, { abTestingEnabled } from '@/react-bricks/config'

const withAbTestingMiddleware = createAbTestingMiddleware({
  i18n,
  config: rbConfig,
})
const withI18nMiddleware = createI18nMiddleware({ i18n, NextResponse })

const middleware = abTestingEnabled
  ? chain([withAbTestingMiddleware, withI18nMiddleware])
  : withI18nMiddleware

export default middleware

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|admin|logo.svg|bricks-preview-images|preview).*)',
  ],
}
