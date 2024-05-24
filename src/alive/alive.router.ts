
import { Effect, pipe } from "effect"
import { Api, ApiGroup, RouterBuilder } from "effect-http"

import { Schema } from "@effect/schema"

export const AliveApiGroup = pipe(
	ApiGroup.make("Alive", {
		description: "Alive Api",
	}),
	ApiGroup.addEndpoint(
		ApiGroup.get("alive::get", "/alive").pipe(Api.setResponseBody(Schema.String))
	),
)

export const aliveApiSpecs = Api.make().pipe(Api.addGroup(AliveApiGroup))

const aliveHandler = () => Effect.gen(function*() {
	return "Service up and running"
})

export const aliveSpecHandler = RouterBuilder.handler(aliveApiSpecs, "alive::get", aliveHandler)

export const aliveRoutes = RouterBuilder.make(aliveApiSpecs).pipe(
	RouterBuilder.handle(aliveSpecHandler),
)

export const aliveRouter = RouterBuilder.getRouter(aliveRoutes)
// const HttpLive = Http.router.empty.pipe(
// 	Http.router.get(
// 		"/",
// 		Effect.map(
// 			Http.request.ServerRequest,
// 			(req) => Http.response.text(req.url)
// 		)
// 	),
// 	Http.router.use(Middlewares.accessLog()),
// )
