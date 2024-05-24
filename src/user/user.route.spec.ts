
import { Api, RouterBuilder, ApiGroup, HttpError, ApiResponse, Middlewares } from "effect-http"
import * as Http from "@effect/platform/HttpServer"
import { Schema } from "@effect/schema"
import { Effect, pipe } from "effect"
import { User, UserRaw, UserRepository, type UserRawT } from "./user"
import { withMiddleware } from "../common/middleware"

export const Response = Schema.Struct({ name: Schema.String })
export const GetIdFromPath = Schema.Struct({ id: Schema.NumberFromString })
export type GetIdFromPathT = Schema.Schema.Type<typeof GetIdFromPath>

export class ApiError extends Schema.TaggedError<ApiError>()("ApiError", {
	message: Schema.String,
	details: Schema.String
}) { }

export const userApiSpecAsGroup = pipe(
	ApiGroup.make("Users", {
		description: "All about users",
	}),
	ApiGroup.addEndpoint(
		ApiGroup.get("user::get", "/user/:id").pipe(
			Api.setResponseBody(User)
			, Api.setRequestPath(GetIdFromPath)
			, Api.addResponse(ApiResponse.make(404, ApiError)))
	),
	ApiGroup.addEndpoint(
		ApiGroup.post("user::store", "/user").pipe(Api.setResponseBody(User)).pipe(Api.setRequestBody(UserRaw))
	),
	ApiGroup.addEndpoint(
		ApiGroup.put("user::put", "/user").pipe(Api.setResponseBody(Response))
	),
	ApiGroup.addEndpoint(
		ApiGroup.get("user::get-all", "/user/all").pipe(Api.setResponseBody(Schema.Array(User)))
	),
	ApiGroup.addEndpoint(
		ApiGroup.delete("user::delete", "/user/:id").pipe(Api.setResponseBody(User), Api.setRequestPath(GetIdFromPath))
	)
)

export const userApiSpecs = Api.make().pipe(Api.addGroup(userApiSpecAsGroup))

const getUserHandler = (path: GetIdFromPathT) => Effect.gen(function*(_) {
	const userRepo = yield* UserRepository
	const user = yield* _(userRepo.getUser(path.id).pipe(Effect.catchTags({
		"UserNotFound": ({ message }) => HttpError.notFoundError({
			message: message,
			details: message
		})
	})))
	return user
})

const deleteUserHandler = (path: GetIdFromPathT) => Effect.gen(function*(_) {
	const userRepo = yield* UserRepository
	const user = yield* userRepo.deleteUser(path.id).pipe(Effect.catchTags({
		"UserNotFound": ({ message }) => HttpError.notFoundError({
			message: message,
			details: message
		})
	}))
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


export const deleteHandler = RouterBuilder.handler(userApiSpecs, "user::delete", ({ path }) => deleteUserHandler(path))
export const getHandler = RouterBuilder.handler(userApiSpecs, "user::get", (req) => getUserHandler(req.path))
export const storeHandler = RouterBuilder.handler(userApiSpecs, "user::store", req => storeUserHandler(req.body))
export const getAllHandlers = RouterBuilder.handler(userApiSpecs, "user::get-all", getAllHandler)
export const putHandler = RouterBuilder.handler(userApiSpecs, "user::put", () => Effect.succeed({ name: "update user" }))

export const userRoutes = RouterBuilder.make(userApiSpecs).pipe(
	RouterBuilder.handle(getHandler),
	RouterBuilder.handle(storeHandler),
	RouterBuilder.handle(putHandler),
	RouterBuilder.handle(getAllHandlers),
	RouterBuilder.handle(deleteHandler)
)
export const userRouter = RouterBuilder.getRouter(userRoutes).pipe(Http.router.use(withMiddleware("M1")))
