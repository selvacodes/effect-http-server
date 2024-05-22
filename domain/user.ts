
import { Config, Context, Effect, Layer, Ref, pipe, Array, Option, Data } from "effect"
import { Schema } from "@effect/schema"

export const User = Schema.Struct({
	id: Schema.Number,
	name: Schema.String,
	email: Schema.String
})

export const UserRaw = User.pipe(Schema.omit("id"))
export type UserT = Schema.Schema.Type<typeof User>
export type UserRawT = Schema.Schema.Type<typeof UserRaw>


// class UserNotFound extends Data.Error<{ message: string }> {}

export class UserNotFound {
	readonly _tag = "UserNotFound"
}

export class Next extends Context.Tag("Next")<Next, Ref.Ref<number>>() { }

export class Users extends Context.Tag("Users")<Users, Ref.Ref<Array<UserT>>>() { }

const makeUserRepository = Effect.gen(function*() {

	const createUser = (rawUser: UserRawT) => Effect.gen(function*() {
		const nextNumRef = yield* Next
		yield* Ref.update(nextNumRef, n => n + 1)
		const newId = yield* Ref.get(nextNumRef);

		const newUser: UserT = {
			...rawUser, id: newId
		}
		const usersRe = yield* Users
		const users = yield* Ref.get(usersRe);
		const newList = [...users, newUser]
		yield* Ref.update(usersRe, n => newList)
		console.log("data", nextNumRef, newUser)
		return newUser
	})

	const getUser = (id: number) => Effect.gen(function*() {
		// const x = yield* users.pipe(Effect.flatMap(Ref.get))
		const usersRef = yield* Users
		const users = yield* Ref.get(usersRef);
		const result = Array.get(users, id)
		// const effs = Effect.option
		if (Option.isNone(result)) {
			return yield* Effect.fail(new UserNotFound())
		}
		const op = Option.getOrThrow(result)
		return op
		// return op
	})
	const getAll = () => Effect.gen(function*() {
		const usersRe = yield* Users
		const userList = yield* Ref.get(usersRe);
		// const effs = Effect.option
		return userList
		// return op
	})
	return { createUser, getUser, getAll }
})



type UserService = Effect.Effect.Success<typeof makeUserRepository>

export class UserRepository extends Context.Tag("UserRepository")<UserRepository, UserService>() {
	static Live = Layer.effect(UserRepository, makeUserRepository)
}
