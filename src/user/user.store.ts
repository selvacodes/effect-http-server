import { Config, HashMap, Ref, pipe } from 'effect'
import {
  Next,
  User,
  UserRaw,
  UserRepository,
  type UserT,
  Users,
  type UserRawT,
} from './user.op'

export const userIdStore = Ref.make(0)
export const userStore = Ref.make<HashMap.HashMap<number, UserT>>(
  HashMap.empty(),
)
