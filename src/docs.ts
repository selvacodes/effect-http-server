import { NodeRuntime } from '@effect/platform-node'
import { PrettyLogger } from 'effect-log'
import { Effect } from 'effect'
import { NodeServer } from 'effect-http-node'
import { AliveApiGroup } from './alive/alive.router'
import { randomApiGroup } from './random/random.route'
import { userApiSpecAsGroup } from './user/user.route.spec'
import { Api, RouterBuilder, ExampleServer } from 'effect-http'

const allRoutesCombined = Api.make()
  .pipe(Api.addGroup(userApiSpecAsGroup))
  .pipe(Api.addGroup(randomApiGroup))
  .pipe(Api.addGroup(AliveApiGroup))

const routesWithHandler = ExampleServer.make(allRoutesCombined).pipe(
  RouterBuilder.build,
)

export const application = Effect.gen(function* () {
  return yield* routesWithHandler.pipe(NodeServer.listen({ port: 4000 }))
})

application.pipe(Effect.provide(PrettyLogger.layer()), NodeRuntime.runMain)
