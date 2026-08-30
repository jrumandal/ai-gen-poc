import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Address } from './address.type';

/**
 * A user account (public shape — never exposes `passwordHash`).
 *
 * Mirrors the canonical `User` type in `graphql/user.graphql`.
 */
@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  email!: string;

  @Field(() => String)
  name!: string;

  @Field(() => Address)
  address!: Address;
}
