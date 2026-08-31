import { Field, ObjectType } from '@nestjs/graphql';

/**
 * Postal address for a user.
 *
 * Mirrors the canonical `Address` type in `graphql/user.graphql`.
 */
@ObjectType()
export class Address {
  @Field(() => String)
  line1!: string;

  @Field(() => String)
  city!: string;

  @Field(() => String, { nullable: true })
  state?: string | null;

  @Field(() => String)
  postalCode!: string;

  @Field(() => String)
  country!: string;
}
