import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Config, Effect, Ref, pipe } from "effect"
import { NodeServer } from "effect-http-node"
import { Api, Representation, RouterBuilder, Middlewares, ApiGroup } from "effect-http"
import { CustomRandom } from './random'
import { Next, User, UserRaw, UserRepository, UserT, Users, type UserRawT } from "./domain/user"


export const api = Api.make({ title: "Example API" }).pipe(
	Api.addEndpoint(
		Api.get("root", "/").pipe(
			Api.setResponseBody(Schema.Unknown),
			Api.setResponseRepresentations([Representation.plainText, Representation.json])
		)
	)
)

const Response = Schema.Struct({ name: Schema.String })
const GetIdFromPath = Schema.Struct({ id: Schema.Number })
type GetIdFromPathT = Schema.Schema.Type<typeof GetIdFromPath>

const userApi = pipe(
	ApiGroup.make("Users", {
		description: "All about users",
	}),
	ApiGroup.addEndpoint(
		ApiGroup.get("user::get", "/user/:id").pipe(Api.setResponseBody(Response), Api.setRequestPath(GetIdFromPath))
	),
	ApiGroup.addEndpoint(
		ApiGroup.post("user::store", "/user").pipe(Api.setResponseBody(User)).pipe(Api.setRequestBody(UserRaw))

	),
	ApiGroup.addEndpoint(
		ApiGroup.put("user::put", "/user").pipe(Api.setResponseBody(Response))
	),
	ApiGroup.addEndpoint(
		ApiGroup.put("user::get-all", "/user/all").pipe(Api.setResponseBody(Schema.Array(User)))
	),
	ApiGroup.addEndpoint(
		ApiGroup.delete("user::delete", "/user").pipe(Api.setResponseBody(Response))
	)
)
const randomApi = pipe(
	ApiGroup.make("Random", {
		description: "Random Api",
	}),
	ApiGroup.addEndpoint(
		ApiGroup.get("random::get", "/random").pipe(Api.setResponseBody(Schema.Number))
	),
)

const initialState = Ref.make(0)
const initialUsers = Ref.make<Array<UserT>>([])

const randomHandler = Effect.gen(function*() {
	const random = yield* CustomRandom
	const number = yield* random.next
	return number
})

const getUserHandler = (path: GetIdFromPathT) => Effect.gen(function*() {
	const userRepo = yield* UserRepository
	const user = yield* userRepo.getUser(path.id)
	return user
})

const getAllHandler = () => Effect.gen(function*() {
	const userRepo = yield* UserRepository
	const users = yield* userRepo.getAll()
	return users
})

const storeUserHandler = (body: UserRawT) => Effect.gen(function*() {
	const userRepo = yield* UserRepository
	const user = yield* userRepo.createUser(body)
	return user
})
export const apis = api.pipe(Api.addGroup(userApi)).pipe(Api.addGroup(randomApi))

export const app = RouterBuilder.make(apis).pipe(
	RouterBuilder.handle("root", () => Effect.succeed({ content: { hello: "world" }, status: 200 as const })),
	RouterBuilder.handle("user::delete", () => Effect.succeed({ name: "delete user" })),
	RouterBuilder.handle("user::get", (req) => getUserHandler(req.path)),
	RouterBuilder.handle("user::store", req => storeUserHandler(req.body)),
	RouterBuilder.handle("user::put", () => Effect.succeed({ name: "update user" })),
	RouterBuilder.handle("user::get-all", getAllHandler),
	RouterBuilder.handle("random::get", () => randomHandler),
	RouterBuilder.build,
	Middlewares.accessLog(),
	Middlewares.endpointCallsMetric(),
	Middlewares.uuidLogAnnotation()
)

export const application = Effect.gen(function*() {
	const port = yield* Config.number("PORT")
	const main = yield* app.pipe(NodeServer.listen({ port }))
	return main
}).pipe(Effect.provide(CustomRandom.Live)).pipe(Effect.provide(UserRepository.Live))
	.pipe(Effect.provideServiceEffect(Next, initialState))
	.pipe(Effect.provideServiceEffect(Users, initialUsers))

