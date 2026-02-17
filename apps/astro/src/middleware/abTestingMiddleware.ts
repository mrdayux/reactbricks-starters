import { defineMiddleware } from 'astro:middleware'
import { createAbTestingMiddleware } from '@reactbricks/rb-middleware/astro'
import { locales } from '@/i18n/conf'

const handler = createAbTestingMiddleware({ locales })

export const abTestingMiddleware = defineMiddleware(handler)
