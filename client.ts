import { Effect, pipe } from "effect";
import { Client } from "effect-http";
import { apis } from "./application";

const client = Client.make(apis, { baseUrl: "http://localhost:3000" });

const response = pipe(
	client["user::get"]({ path: { id: "12" } }),
	Effect.flatMap((user) => Effect.log(`Got ${user.name}, nice!`)),
	Effect.map((_) => "Success for user::get"),
	Effect.scoped,
);

const response_1 = pipe(
	client["random::get"]({}),
	Effect.flatMap((user) => Effect.log(`Got random ${user}, nice!`)),
	Effect.map((_) => "Success for random::get"),
	Effect.scoped,
);

const allEffects = Effect.all([response, response_1])

Effect.runPromiseExit(allEffects).then(_ => console.log(_))
