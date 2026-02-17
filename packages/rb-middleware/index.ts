export {
  type CookieReader,
  type CookieWriter,
  DEFAULT_AB_TESTING_COOKIE_TTL,
  getAbTestingCookie,
  setAbTestingCookie,
  removeAbTestingCookie,
  selectVariant,
  getAbTestingCookieFromReq,
} from './lib/abTesting'
