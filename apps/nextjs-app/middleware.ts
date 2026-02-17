import { chain } from '@reactbricks/rb-middleware/nextjs-app'
import { withI18nMiddleware } from '@/middlewares/i18nMiddleware'
import { withAbTestingMiddleware } from '@/middlewares/abTestingMiddleware'
import { abTestingEnabled } from '@/react-bricks/config'

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
