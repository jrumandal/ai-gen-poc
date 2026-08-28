import { Field, InputType } from '@nestjs/graphql';

/**
 * Address payload for the `updateProfile` mutation.
 *
 * Mirrors the canonical `AddressInput` in `graphql/user.graphql`.
 */
@InputType()
export class AddressInput {
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
