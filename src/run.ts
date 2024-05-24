import * as Http from '@effect/platform/HttpServer'
import { NodeRuntime } from '@effect/platform-node'
import { PrettyLogger } from 'effect-log'
import { Config, Effect } from 'effect'
import { NodeServer } from 'effect-http-node'
import { CustomRandom } from './random/random.op'
import { Next, UserRepository, Users } from './user/user.op'
import { userStore, userIdStore } from './user/user.store'
import { aliveRouter } from './alive/alive.router'
import { randomRouter } from './random/random.route'
import { userRouter } from './user/user.route.specs'
import { Middlewares } from 'effect-http'

const allRoutesCombined = userRouter
  .pipe(Http.router.concat(aliveRouter))
  .pipe(Http.router.concat(randomRouter))
  .pipe(Http.middleware.make(Middlewares.accessLog()))

export const application = Effect.gen(function* () {
  const port = yield* Config.number('PORT')
  const main = yield* allRoutesCombined.pipe(NodeServer.listen({ port }))
  return main
})
  .pipe(Effect.provide(CustomRandom.Live))
  .pipe(Effect.provide(UserRepository.Live))
  .pipe(Effect.provideServiceEffect(Next, userIdStore))
  .pipe(Effect.provideServiceEffect(Users, userStore))

application.pipe(Effect.provide(PrettyLogger.layer()), NodeRuntime.runMain)
