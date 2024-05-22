import { NodeRuntime } from "@effect/platform-node"
import { Schema } from "@effect/schema"
import { Config, Effect, pipe } from "effect"
import { NodeServer } from "effect-http-node"
import { Api, Representation, RouterBuilder, Middlewares, ApiGroup } from "effect-http"
import { CustomRandom } from './random'

export const api = Api.make({ title: "Example API" }).pipe(
	Api.addEndpoint(
		Api.get("root", "/").pipe(
			Api.setResponseBody(Schema.Unknown),
			Api.setResponseRepresentations([Representation.plainText, Representation.json])
		)
	)
)

const Response = Schema.Struct({ name: Schema.String })
const GetIdFromPath = Schema.Struct({ id: Schema.String })
type GetIdFromPathT = Schema.Schema.Type<typeof GetIdFromPath>

const userApi = pipe(
	ApiGroup.make("Users", {
		description: "All about users",
		externalDocs: {
			url: "https://www.google.com/search?q=effect-http"
		}
	}),
	ApiGroup.addEndpoint(
		ApiGroup.get("getUser", "/user/:id").pipe(Api.setResponseBody(Response), Api.setRequestPath(GetIdFromPath))
	),
	ApiGroup.addEndpoint(
		ApiGroup.post("storeUser", "/user").pipe(Api.setResponseBody(Response))
	),
	ApiGroup.addEndpoint(
		ApiGroup.put("updateUser", "/user").pipe(Api.setResponseBody(Response))
	),
	ApiGroup.addEndpoint(
		ApiGroup.delete("deleteUser", "/user").pipe(Api.setResponseBody(Response))
	)
)
const randomApi = pipe(
	ApiGroup.make("Users", {
		description: "Random Api",
		externalDocs: {
			url: "https://www.google.com/search?q=effect-http"
		}
	}),
	ApiGroup.addEndpoint(
		ApiGroup.get("random::get", "/random").pipe(Api.setResponseBody(Schema.Number))
	),
)


const randomHandler =Effect.gen(function*() {
	const random = yield* CustomRandom
	const number = yield* random.next
	return number
})

const getUserHandler =  (path : GetIdFromPathT) =>  Effect.gen(function*() {
	const random = yield* CustomRandom
	const number = yield* random.next
	return { name: `get random for ${path.id} :: ${number}`}
})
const apis = api.pipe(Api.addGroup(userApi)).pipe(Api.addGroup(randomApi))

export const app = RouterBuilder.make(apis).pipe(
	RouterBuilder.handle("root", () => Effect.succeed({ content: { hello: "world" }, status: 200 as const })),
	RouterBuilder.handle("deleteUser", () => Effect.succeed({ name: "delete world" })),
	RouterBuilder.handle("getUser", (req) => getUserHandler(req.path)),
	RouterBuilder.handle("storeUser", () => Effect.succeed({ name: "store world" })),
	RouterBuilder.handle("updateUser", () => Effect.succeed({ name: "update world" })),
	RouterBuilder.handle("random::get", () => randomHandler),
	RouterBuilder.build,
	Middlewares.accessLog(),
	Middlewares.endpointCallsMetric(),
	Middlewares.uuidLogAnnotation()
)

const application = Effect.gen(function*() {
	const port = yield* Config.number("PORT")
	const main = yield* app.pipe(NodeServer.listen({ port }))
	return main
}).pipe(Effect.provide(CustomRandom.Live))

NodeRuntime.runMain(application)
