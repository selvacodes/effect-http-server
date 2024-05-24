import { Context, Effect, Layer, Ref, Array, Data, HashMap } from 'effect'
import { Schema } from '@effect/schema'

export const User = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String,
})

export const UserRaw = User.pipe(Schema.omit('id'))
export type UserT = Schema.Schema.Type<typeof User>
export type UserRawT = Schema.Schema.Type<typeof UserRaw>

class UserNotFound extends Data.TaggedError('UserNotFound')<{
  message: string
}> {}

export class Next extends Context.Tag('Next')<Next, Ref.Ref<number>>() {}

export class Users extends Context.Tag('Users')<
  Users,
  Ref.Ref<HashMap.HashMap<number, UserT>>
>() {}

const makeUserRepository = Effect.gen(function* () {
  const createUser = (rawUser: UserRawT) =>
    Effect.gen(function* (_) {
      const nextNumRef = yield* Next
      yield* Ref.update(nextNumRef, (n) => n + 1)
      const newId = yield* Ref.get(nextNumRef)
      const newUser: UserT = {
        ...rawUser,
        id: newId,
      }
      const usersRe = yield* Users
      yield* Ref.update(usersRe, (_users) => {
        return HashMap.set(_users, newId, newUser)
      })
      return newUser
    })

  const getUser = (id: number) =>
    Effect.gen(function* (_) {
      const usersRef = yield* Users
      const users = yield* Ref.get(usersRef).pipe(
        Effect.map(HashMap.values),
        Effect.map(Array.fromIterable),
      )
      const result = Array.get(users, id)
      const r1 = yield* result.pipe(
        Effect.mapError(
          (_) => new UserNotFound({ message: `User::${id} not found` }),
        ),
      )
      return r1
    })

  const getAll = () =>
    Effect.gen(function* (_) {
      const usersRe = yield* Users
      const userList = yield* _(
        Ref.get(usersRe).pipe(
          Effect.map(HashMap.values),
          Effect.map(Array.fromIterable),
        ),
      )
      return userList
    })

  const deleteUser = (id: number) =>
    Effect.gen(function* (_) {
      const usersRef = yield* Users
      const user = yield* _(
        Ref.get(usersRef).pipe(Effect.flatMap(HashMap.get(id))),
      ).pipe(
        Effect.mapError(
          (_) => new UserNotFound({ message: `User::${id} not found` }),
        ),
      )
      yield* _(Ref.get(usersRef).pipe(Effect.map(HashMap.remove(id))))
      return user
    })

  return { createUser, getUser, getAll, deleteUser }
})

type UserService = Effect.Effect.Success<typeof makeUserRepository>

export class UserRepository extends Context.Tag('UserRepository')<
  UserRepository,
  UserService
>() {
  static Live = Layer.effect(UserRepository, makeUserRepository)
}
