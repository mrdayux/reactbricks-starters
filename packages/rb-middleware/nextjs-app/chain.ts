export type CustomMiddleware = (
  request: any,
  event: any,
  response: any
) => any | Promise<any>

type MiddlewareFactory = (middleware: CustomMiddleware) => CustomMiddleware

export function chain(
  functions: MiddlewareFactory[],
  index = 0
): CustomMiddleware {
  const current = functions[index]

  if (current) {
    const next = chain(functions, index + 1)
    return current(next)
  }

  return (
    _request: any,
    _event: any,
    response: any
  ) => {
    return response
  }
}
