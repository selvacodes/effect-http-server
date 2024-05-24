import * as Http from '@effect/platform/HttpServer'
import { Effect } from 'effect'

export const withDummyRouter = (name: string) =>
  Http.middleware.make((app) =>
    Effect.gen(function* () {
      console.log('from dummy middleware', name) // Log the middleware name when a route is accessed
      return yield* app // Continue with the original application flow
    }),
  )
