import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Config, Effect, HashMap, Ref, pipe } from "effect"
import { NodeServer } from "effect-http-node"
import { Api, Representation, RouterBuilder, Middlewares, ApiGroup } from "effect-http"
import { CustomRandom } from './random'
import { Next, User, UserRaw, UserRepository, type UserT, Users, type UserRawT } from "./domain/user"
import { deleteHandler, getAllHandlers, getHandler, putHandler, storeHandler, userApiSpecAsGroup, type GetIdFromPathT } from "./domain/user.route.spec"


export const api = Api.make({ title: "Example API" }).pipe(
	Api.addEndpoint(
		Api.get("root", "/").pipe(
			Api.setResponseBody(Schema.Unknown),
			Api.setResponseRepresentations([Representation.plainText, Representation.json])
		)
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
const initialUsers = Ref.make<HashMap.HashMap<number, UserT>>(HashMap.empty())

const randomHandler = Effect.gen(function*() {
	const random = yield* CustomRandom
	const number = yield* random.next
	return number
})

export const apis = Api.make().pipe(Api.addGroup(userApiSpecAsGroup)).pipe(Api.addGroup(randomApi))

export const app = RouterBuilder.make(apis).pipe(
	RouterBuilder.handle("random::get", () => randomHandler),
	RouterBuilder.handle(getHandler),
	RouterBuilder.handle(storeHandler),
	RouterBuilder.handle(putHandler),
	RouterBuilder.handle(getAllHandlers),
	RouterBuilder.handle(deleteHandler),
	RouterBuilder.build,
	Middlewares.accessLog(),
	Middlewares.endpointCallsMetric(),
	// Middlewares.uuidLogAnnotation()
)

export const application = Effect.gen(function*() {
	const port = yield* Config.number("PORT")
	const main = yield* app.pipe(NodeServer.listen({ port }))
	return main
}).pipe(Effect.provide(CustomRandom.Live)).pipe(Effect.provide(UserRepository.Live))
	.pipe(Effect.provideServiceEffect(Next, initialState))
	.pipe(Effect.provideServiceEffect(Users, initialUsers))

