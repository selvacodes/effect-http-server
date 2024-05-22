import { Config, Context, Effect, Layer, pipe } from "effect"
import { implies } from "effect/Predicate"

export class CustomRandom extends Context.Tag("CustomRandom")<CustomRandom,{
 next : Effect.Effect<number>
}>() {

  static Live = Layer.succeed(CustomRandom , {
    next : Effect.succeed(Math.random())
  })

  static Fake = Layer.succeed(CustomRandom , {
    next : Effect.succeed(42)
  })

}
