import { Effect, pipe } from 'effect'
import { Api, Client } from 'effect-http'
import { userApiSpecs } from './user/user.route.specs.ts'
import { randomApiGroup } from './random/random.route.ts'
import { AliveApiGroup } from './alive/alive.router.ts'

const apiSpecsCombined = userApiSpecs
  .pipe(Api.addGroup(randomApiGroup))
  .pipe(Api.addGroup(AliveApiGroup))

const client = Client.make(apiSpecsCombined, {
  baseUrl: 'http://localhost:3000',
})

const response = pipe(
  client['user::store']({
    body: { name: 'selva' + Math.random(), email: 'selva.g@workativ.com' },
  }),
  Effect.flatMap((user) => Effect.log(`Got ${user.name}, nice!`)),
  Effect.map((_) => 'Success for user::get'),
  Effect.scoped,
)
const response2 = pipe(
  client['user::store']({
    body: { name: 'selva' + Math.random(), email: 'selva.g@workativ.com' },
  }),
  Effect.flatMap((user) => Effect.log(`Got ${user.name}, nice!`)),
  Effect.map((_) => 'Success for user::get'),
  Effect.scoped,
)
const response3 = pipe(
  client['user::store']({
    body: { name: 'selva' + Math.random(), email: 'selva.g@workativ.com' },
  }),
  Effect.flatMap((user) => Effect.log(`Got ${user.name}, nice!`)),
  Effect.map((_) => 'Success for user::get'),
  Effect.scoped,
)

const response4 = pipe(
  client['user::get-all']({}),
  Effect.flatMap((user) => Effect.log(`Got nice!`, user)),
  Effect.map((_) => 'Success for user::get'),
  Effect.scoped,
)
const response5 = pipe(
  client['user::get']({ path: { id: 10 } }),
  Effect.flatMap((user) => Effect.log(`Got nice!`, user)),
  Effect.map((_) => 'Success for user::get'),
  Effect.scoped,
)

const allEffects = Effect.all([response, response2, response3]).pipe(
  Effect.flatMap((_) => response4),
)
const y = Effect.gen(function* () {
  const one = yield* response4
  const two = yield* allEffects
  const three = yield* response5
})

Effect.runPromiseExit(y).then((_) => console.log(_))
