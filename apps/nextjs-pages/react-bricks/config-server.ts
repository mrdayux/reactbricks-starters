import { types } from 'react-bricks/frontend'

const serverConfig = {
  appId: process.env.NEXT_PUBLIC_APP_ID || '',
  apiKey: process.env.API_KEY || '',
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  apiPrefix: 'staging',
  bricks: [],
  pageTypes: [],
} as unknown as types.ReactBricksConfig

// Enable only for Enterprise plans with the A/B testing module active.
export const abTestingEnabled = true

export default serverConfig
