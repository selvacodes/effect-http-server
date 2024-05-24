import { Effect, pipe } from "effect"
import { Api, ApiGroup, RouterBuilder } from "effect-http"

import { Schema } from "@effect/schema"
import { CustomRandom } from "./random.op"

export const randomApiGroup = pipe(
	ApiGroup.make("Random", {
		description: "Random Api",
	}),
	ApiGroup.addEndpoint(
		ApiGroup.get("random::get", "/random").pipe(Api.setResponseBody(Schema.Number))
	),
)


export const randomApiSpecs = Api.make().pipe(Api.addGroup(randomApiGroup))

const getHandler = () => Effect.gen(function*() {
	const random = yield* CustomRandom
	const number = yield* random.next
	return number
})

export const getSpecHandler = RouterBuilder.handler(randomApiSpecs, "random::get", getHandler)

export const randomRoutes = RouterBuilder.make(randomApiSpecs).pipe(
	RouterBuilder.handle(getSpecHandler),
)

export const randomRouter = RouterBuilder.getRouter(randomRoutes)
