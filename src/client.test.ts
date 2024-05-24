import { describe, test, expect } from 'vitest'
import { it } from '@effect/vitest'
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
describe('Server is up', () => {
  it.effect('Test Server is alive', () =>
    Effect.gen(function* ($) {
      const response = yield* pipe(client['alive::get']({}), Effect.scoped)
      expect(response).toBe('Service up and running')
    }),
  )
})

describe('Random routes', () => {
  it.effect('Get Random number', () =>
    Effect.gen(function* ($) {
      const response = yield* pipe(client['random::get']({}), Effect.scoped)
      expect(response).toBeLessThan(1)
    }),
  )
})

describe('User routes', () => {
  it.effect('Store User', () =>
    Effect.gen(function* ($) {
      const response = yield* pipe(
        client['user::store']({
          body: {
            name: 'selva' + Math.random(),
            email: 'selva.g@workativ.com',
          },
        }),
        Effect.scoped,
      )
      expect(response.name).toContain('selva')
    }),
  )
  it.effect('Store User', () =>
    Effect.gen(function* ($) {
      const response = yield* pipe(client['user::get-all']({}), Effect.scoped)
      expect(response.length).toBeGreaterThan(1)
    }),
  )
})
