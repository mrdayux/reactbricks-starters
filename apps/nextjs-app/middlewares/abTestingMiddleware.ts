import { createAbTestingMiddleware } from '@reactbricks/rb-middleware/nextjs-app'

import { i18n } from '@/i18n-config'
import config from '@/react-bricks/config'

export const withAbTestingMiddleware = createAbTestingMiddleware({
  i18n,
  config,
})
