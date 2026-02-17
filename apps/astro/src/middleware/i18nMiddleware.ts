import { defineMiddleware } from 'astro:middleware'
import { createI18nMiddleware } from '@reactbricks/rb-middleware/astro'
import { defaultLocale, locales } from '@/i18n/conf'

const handler = createI18nMiddleware({ locales, defaultLocale })

export const i18nMiddleware = defineMiddleware(handler)
