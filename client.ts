import { Effect, pipe } from "effect";
import { Client } from "effect-http";
import { apis } from "./application";

const client = Client.make(apis, { baseUrl: "http://localhost:3000" });

const response = pipe(
	client["user::store"]({ body: { name: "selva" + Math.random(), email: "selva.g@workativ.com" } }),
	Effect.flatMap((user) => Effect.log(`Got ${user.name}, nice!`)),
	Effect.map((_) => "Success for user::get"),
	Effect.scoped,
);
const response2 = pipe(
	client["user::store"]({ body: { name: "selva" + Math.random(), email: "selva.g@workativ.com" } }),
	Effect.flatMap((user) => Effect.log(`Got ${user.name}, nice!`)),
	Effect.map((_) => "Success for user::get"),
	Effect.scoped,
);
const response3 = pipe(
	client["user::store"]({ body: { name: "selva" + Math.random(), email: "selva.g@workativ.com" } }),
	Effect.flatMap((user) => Effect.log(`Got ${user.name}, nice!`)),
	Effect.map((_) => "Success for user::get"),
	Effect.scoped,
);

const response4 = pipe(
	client["user::get-all"]({}),
	Effect.flatMap((user) => Effect.log(`Got nice!`, user)),
	Effect.map((_) => "Success for user::get"),
	Effect.scoped,
);

// const response_1 = pipe(
// 	client["random::get"]({}),
// 	Effect.flatMap((user) => Effect.log(`Got random ${user}, nice!`)),
// 	Effect.map((_) => "Success for random::get"),
// 	Effect.scoped,
// );
//

const allEffects = Effect.all([response, response2, response3]).pipe(Effect.flatMap(_ => response4))
const y = Effect.gen(function*() {
	const one = yield* response4
	const two = yield* allEffects
})

Effect.runPromiseExit(y).then(_ => console.log(_))
