import { NextResponse } from 'next/server'
import { createI18nMiddleware } from '@reactbricks/rb-middleware/nextjs-app'

import { i18n } from '@/i18n-config'

export const withI18nMiddleware = createI18nMiddleware({
  i18n,
  NextResponse,
})
