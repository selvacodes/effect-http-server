import { NodeRuntime } from "@effect/platform-node"
import { app, application } from "./application"
import { PrettyLogger } from "effect-log"
import { Effect } from "effect"

// NodeServer.listen({ port: 3000 }),
//  Effect.provide(PrettyLogger.layer()),
//  NodeRuntime.runMain

application.pipe(Effect.provide(PrettyLogger.layer()),
	NodeRuntime.runMain)
